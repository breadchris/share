package vibekanban

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"sync"
	"syscall"
	"time"

	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProcessManager struct {
	db        *gorm.DB
	processes map[string]*ManagedProcess
	mu        sync.RWMutex
}

type ManagedProcess struct {
	ID        string
	AttemptID string
	Type      string // setupscript, codingagent, devserver
	Command   string
	Args      []string
	WorkDir   string
	Env       []string
	
	cmd       *exec.Cmd
	cancelCtx context.CancelFunc
	stdout    *ProcessOutput
	stderr    *ProcessOutput
	
	Status    string    // pending, running, completed, failed, killed
	StartTime time.Time
	EndTime   *time.Time
	ExitCode  *int
	
	// For dev servers
	Port int
	URL  string
}

type ProcessOutput struct {
	mu     sync.RWMutex
	buffer []string
	writer io.Writer
}

func NewProcessOutput() *ProcessOutput {
	return &ProcessOutput{
		buffer: make([]string, 0),
	}
}

func (po *ProcessOutput) Write(p []byte) (n int, err error) {
	po.mu.Lock()
	defer po.mu.Unlock()
	
	line := string(p)
	po.buffer = append(po.buffer, line)
	
	// Keep only last 1000 lines to prevent memory issues
	if len(po.buffer) > 1000 {
		po.buffer = po.buffer[len(po.buffer)-1000:]
	}
	
	if po.writer != nil {
		return po.writer.Write(p)
	}
	
	return len(p), nil
}

func (po *ProcessOutput) GetLines() []string {
	po.mu.RLock()
	defer po.mu.RUnlock()
	
	lines := make([]string, len(po.buffer))
	copy(lines, po.buffer)
	return lines
}

func (po *ProcessOutput) GetOutput() string {
	lines := po.GetLines()
	output := ""
	for _, line := range lines {
		output += line
	}
	return output
}

func NewProcessManager(db *gorm.DB) *ProcessManager {
	return &ProcessManager{
		db:        db,
		processes: make(map[string]*ManagedProcess),
	}
}

// StartSetupScript starts the project setup script
func (pm *ProcessManager) StartSetupScript(attemptID, script, workDir string) (*models.VibeExecutionProcess, error) {
	if script == "" {
		return nil, fmt.Errorf("setup script is empty")
	}

	processID := uuid.NewString()
	
	// Create database record
	dbProcess := &models.VibeExecutionProcess{
		Model: models.Model{
			ID: processID,
		},
		AttemptID: attemptID,
		Type:      "setupscript",
		Command:   script,
		Status:    "pending",
	}
	
	if err := pm.db.Create(dbProcess).Error; err != nil {
		return nil, fmt.Errorf("failed to create process record: %w", err)
	}

	// Create managed process
	managedProcess := &ManagedProcess{
		ID:        processID,
		AttemptID: attemptID,
		Type:      "setupscript", 
		Command:   "/bin/bash",
		Args:      []string{"-c", script},
		WorkDir:   workDir,
		Status:    "pending",
		stdout:    NewProcessOutput(),
		stderr:    NewProcessOutput(),
	}

	pm.mu.Lock()
	pm.processes[processID] = managedProcess
	pm.mu.Unlock()

	// Start the process
	go pm.runProcess(managedProcess)

	return dbProcess, nil
}

// StartCodingAgent starts an AI coding agent
func (pm *ProcessManager) StartCodingAgent(attemptID, executor, prompt, workDir string, env []string) (*models.VibeExecutionProcess, error) {
	processID := uuid.NewString()
	
	// Build command based on executor type
	var command string
	var args []string
	
	switch executor {
	case "claude":
		command = "npx"
		args = []string{"@anthropic-ai/claude-cli", prompt}
	case "gemini":
		command = "npx"
		args = []string{"@google-ai/gemini-cli", prompt}
	case "amp":
		command = "amp"
		args = []string{prompt}
	default:
		return nil, fmt.Errorf("unsupported executor: %s", executor)
	}

	// Create database record
	dbProcess := &models.VibeExecutionProcess{
		Model: models.Model{
			ID: processID,
		},
		AttemptID: attemptID,
		Type:      "codingagent",
		Command:   fmt.Sprintf("%s %v", command, args),
		Status:    "pending",
	}
	
	if err := pm.db.Create(dbProcess).Error; err != nil {
		return nil, fmt.Errorf("failed to create process record: %w", err)
	}

	// Create managed process
	managedProcess := &ManagedProcess{
		ID:        processID,
		AttemptID: attemptID,
		Type:      "codingagent",
		Command:   command,
		Args:      args,
		WorkDir:   workDir,
		Env:       env,
		Status:    "pending",
		stdout:    NewProcessOutput(),
		stderr:    NewProcessOutput(),
	}

	pm.mu.Lock()
	pm.processes[processID] = managedProcess
	pm.mu.Unlock()

	// Start the process
	go pm.runProcess(managedProcess)

	return dbProcess, nil
}

// StartDevServer starts a development server
func (pm *ProcessManager) StartDevServer(attemptID, script, workDir string, port int) (*models.VibeExecutionProcess, error) {
	if script == "" {
		return nil, fmt.Errorf("dev script is empty")
	}

	processID := uuid.NewString()
	
	// Create database record
	dbProcess := &models.VibeExecutionProcess{
		Model: models.Model{
			ID: processID,
		},
		AttemptID: attemptID,
		Type:      "devserver",
		Command:   script,
		Status:    "pending",
		Port:      port,
		URL:       fmt.Sprintf("http://localhost:%d", port),
	}
	
	if err := pm.db.Create(dbProcess).Error; err != nil {
		return nil, fmt.Errorf("failed to create process record: %w", err)
	}

	// Create managed process
	managedProcess := &ManagedProcess{
		ID:        processID,
		AttemptID: attemptID,
		Type:      "devserver",
		Command:   "/bin/bash",
		Args:      []string{"-c", script},
		WorkDir:   workDir,
		Status:    "pending",
		Port:      port,
		URL:       fmt.Sprintf("http://localhost:%d", port),
		stdout:    NewProcessOutput(),
		stderr:    NewProcessOutput(),
	}

	pm.mu.Lock()
	pm.processes[processID] = managedProcess
	pm.mu.Unlock()

	// Start the process
	go pm.runProcess(managedProcess)

	return dbProcess, nil
}

// runProcess executes the managed process
func (pm *ProcessManager) runProcess(mp *ManagedProcess) {
	ctx, cancel := context.WithCancel(context.Background())
	mp.cancelCtx = cancel

	// Create command
	cmd := exec.CommandContext(ctx, mp.Command, mp.Args...)
	cmd.Dir = mp.WorkDir
	cmd.Env = append(os.Environ(), mp.Env...)
	
	// Set up pipes
	cmd.Stdout = mp.stdout
	cmd.Stderr = mp.stderr
	
	mp.cmd = cmd
	mp.Status = "running"
	mp.StartTime = time.Now()

	// Update database
	pm.updateProcessInDB(mp)

	// Start the process
	err := cmd.Start()
	if err != nil {
		mp.Status = "failed"
		now := time.Now()
		mp.EndTime = &now
		pm.updateProcessInDB(mp)
		return
	}

	// Wait for completion
	err = cmd.Wait()
	now := time.Now()
	mp.EndTime = &now

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			if status, ok := exitError.Sys().(syscall.WaitStatus); ok {
				exitCode := status.ExitStatus()
				mp.ExitCode = &exitCode
			}
		}
		mp.Status = "failed"
	} else {
		exitCode := 0
		mp.ExitCode = &exitCode
		mp.Status = "completed"
	}

	pm.updateProcessInDB(mp)
}

// updateProcessInDB updates the process record in the database
func (pm *ProcessManager) updateProcessInDB(mp *ManagedProcess) {
	var dbProcess models.VibeExecutionProcess
	if err := pm.db.Where("id = ?", mp.ID).First(&dbProcess).Error; err != nil {
		return
	}

	dbProcess.Status = mp.Status
	dbProcess.StartTime = &mp.StartTime
	dbProcess.EndTime = mp.EndTime
	dbProcess.ExitCode = mp.ExitCode
	dbProcess.StdOut = mp.stdout.GetOutput()
	dbProcess.StdErr = mp.stderr.GetOutput()
	
	if mp.cmd != nil && mp.cmd.Process != nil {
		dbProcess.ProcessID = mp.cmd.Process.Pid
	}

	pm.db.Save(&dbProcess)
}

// GetProcess returns a managed process by ID
func (pm *ProcessManager) GetProcess(processID string) (*ManagedProcess, bool) {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	
	process, exists := pm.processes[processID]
	return process, exists
}

// KillProcess terminates a running process
func (pm *ProcessManager) KillProcess(processID string) error {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	process, exists := pm.processes[processID]
	if !exists {
		return fmt.Errorf("process not found")
	}

	if process.Status != "running" {
		return fmt.Errorf("process is not running")
	}

	if process.cancelCtx != nil {
		process.cancelCtx()
	}

	if process.cmd != nil && process.cmd.Process != nil {
		process.cmd.Process.Kill()
	}

	process.Status = "killed"
	now := time.Now()
	process.EndTime = &now

	pm.updateProcessInDB(process)
	
	return nil
}

// GetProcessOutput returns the stdout and stderr of a process
func (pm *ProcessManager) GetProcessOutput(processID string) (stdout, stderr string, err error) {
	process, exists := pm.GetProcess(processID)
	if !exists {
		return "", "", fmt.Errorf("process not found")
	}

	return process.stdout.GetOutput(), process.stderr.GetOutput(), nil
}

// GetProcessesByAttempt returns all processes for a given attempt
func (pm *ProcessManager) GetProcessesByAttempt(attemptID string) []*ManagedProcess {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	
	var processes []*ManagedProcess
	for _, process := range pm.processes {
		if process.AttemptID == attemptID {
			processes = append(processes, process)
		}
	}
	
	return processes
}

// CleanupCompletedProcesses removes completed processes from memory
func (pm *ProcessManager) CleanupCompletedProcesses() {
	pm.mu.Lock()
	defer pm.mu.Unlock()
	
	for id, process := range pm.processes {
		if process.Status == "completed" || process.Status == "failed" || process.Status == "killed" {
			delete(pm.processes, id)
		}
	}
}

// GetLiveOutput returns a channel that streams live output from a process
func (pm *ProcessManager) GetLiveOutput(processID string) (<-chan string, error) {
	process, exists := pm.GetProcess(processID)
	if !exists {
		return nil, fmt.Errorf("process not found")
	}

	outputChan := make(chan string, 100)
	
	// Create a custom writer that sends to the channel
	writer := &channelWriter{ch: outputChan}
	process.stdout.writer = writer
	
	// Send existing output
	go func() {
		lines := process.stdout.GetLines()
		for _, line := range lines {
			select {
			case outputChan <- line:
			default:
				// Channel is full, skip
			}
		}
	}()
	
	return outputChan, nil
}

type channelWriter struct {
	ch chan<- string
}

func (cw *channelWriter) Write(p []byte) (n int, err error) {
	select {
	case cw.ch <- string(p):
	default:
		// Channel is full, skip
	}
	return len(p), nil
}