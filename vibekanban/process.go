package vibekanban

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
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

// DelegationContext represents context for process delegation after setup completion
type DelegationContext struct {
	DelegateTo      string                 `json:"delegate_to"`
	OperationParams map[string]interface{} `json:"operation_params"`
}

// AutoSetupConfig represents configuration for automatic setup detection
type AutoSetupConfig struct {
	Operation       string                 `json:"operation"`
	OperationParams map[string]interface{} `json:"operation_params,omitempty"`
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

// AutoSetupAndExecute automatically runs setup if needed, then continues with the specified operation
func (pm *ProcessManager) AutoSetupAndExecute(attemptID, taskID, projectID, operation string, operationParams map[string]interface{}) error {
	// Check if setup is completed for this worktree
	setupCompleted, err := pm.IsSetupCompleted(attemptID)
	if err != nil {
		return fmt.Errorf("failed to check setup status: %w", err)
	}

	// Get project to check if setup script exists
	var project models.VibeProject
	if err := pm.db.First(&project, "id = ?", projectID).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	needsSetup := pm.ShouldRunSetupScript(&project) && !setupCompleted

	if needsSetup {
		// Run setup with delegation to the original operation
		return pm.ExecuteSetupWithDelegation(attemptID, taskID, projectID, operation, operationParams)
	} else {
		// Setup not needed or already completed, continue with original operation
		return pm.ExecuteOperation(attemptID, taskID, projectID, operation, operationParams)
	}
}

// ExecuteSetupWithDelegation executes setup script with delegation context for continuing after completion
func (pm *ProcessManager) ExecuteSetupWithDelegation(attemptID, taskID, projectID, delegateTo string, operationParams map[string]interface{}) error {
	// Get project and task attempt
	var project models.VibeProject
	if err := pm.db.First(&project, "id = ?", projectID).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	var attempt models.VibeTaskAttempt
	if err := pm.db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		return fmt.Errorf("task attempt not found: %w", err)
	}

	// Create delegation context
	delegationContext := DelegationContext{
		DelegateTo: delegateTo,
		OperationParams: map[string]interface{}{
			"task_id":     taskID,
			"project_id":  projectID,
			"attempt_id":  attemptID,
			"additional": operationParams,
		},
	}

	// Start setup script with delegation context
	if project.SetupScript == "" {
		return fmt.Errorf("no setup script configured")
	}

	_, err := pm.StartSetupScriptWithDelegation(attemptID, project.SetupScript, attempt.WorktreePath, delegationContext)
	return err
}

// StartSetupScriptWithDelegation starts setup script with delegation context
func (pm *ProcessManager) StartSetupScriptWithDelegation(attemptID, script, workDir string, delegation DelegationContext) (*models.VibeExecutionProcess, error) {
	if script == "" {
		return nil, fmt.Errorf("setup script is empty")
	}

	processID := uuid.NewString()
	
	// Serialize delegation context
	delegationJSON, err := json.Marshal(delegation)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize delegation context: %w", err)
	}

	// Create database record with delegation context in metadata
	dbProcess := &models.VibeExecutionProcess{
		Model: models.Model{
			ID: processID,
		},
		AttemptID: attemptID,
		Type:      "setupscript",
		Command:   script,
		Status:    "pending",
		Metadata:  &models.JSONField[map[string]interface{}]{
			Data: map[string]interface{}{
				"delegation_context": string(delegationJSON),
			},
		},
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
	go pm.runProcessWithDelegation(managedProcess, delegation)

	return dbProcess, nil
}

// runProcessWithDelegation executes a process with delegation handling
func (pm *ProcessManager) runProcessWithDelegation(mp *ManagedProcess, delegation DelegationContext) {
	// Run the process normally first
	pm.runProcess(mp)

	// After completion, check if we need to delegate
	if mp.Status == "completed" && mp.ExitCode != nil && *mp.ExitCode == 0 {
		// Mark setup as completed
		pm.MarkSetupCompleted(mp.AttemptID)

		// Execute the delegated operation
		params := delegation.OperationParams
		delegateAttemptID, _ := params["attempt_id"].(string)
		taskID, _ := params["task_id"].(string)
		projectID, _ := params["project_id"].(string)
		additional, _ := params["additional"].(map[string]interface{})

		if delegateAttemptID != "" && taskID != "" && projectID != "" {
			go func() {
				// Small delay to ensure setup completion is recorded
				time.Sleep(1 * time.Second)
				if err := pm.ExecuteOperation(delegateAttemptID, taskID, projectID, delegation.DelegateTo, additional); err != nil {
					fmt.Printf("Debug: Failed to execute delegated operation %s: %v\n", delegation.DelegateTo, err)
				}
			}()
		}
	}
}

// ExecuteOperation executes the specified operation
func (pm *ProcessManager) ExecuteOperation(attemptID, taskID, projectID, operation string, operationParams map[string]interface{}) error {
	switch operation {
	case "dev_server":
		return pm.StartDevServerDirect(attemptID, taskID, projectID)
	case "coding_agent":
		return pm.StartCodingAgentDirect(attemptID, taskID, projectID)
	case "followup":
		prompt, _ := operationParams["prompt"].(string)
		return pm.StartFollowupExecutionDirect(attemptID, taskID, projectID, prompt)
	default:
		return fmt.Errorf("unknown operation: %s", operation)
	}
}

// StartCodingAgentDirect starts a coding agent directly without setup check
func (pm *ProcessManager) StartCodingAgentDirect(attemptID, taskID, projectID string) error {
	fmt.Printf("Debug: Starting coding agent direct for attempt %s\n", attemptID)
	
	// Get task attempt to determine executor and worktree
	var attempt models.VibeTaskAttempt
	if err := pm.db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		return fmt.Errorf("task attempt not found (ID: %s): %w", attemptID, err)
	}
	
	fmt.Printf("Debug: Found attempt with executor: %s, worktree: %s\n", attempt.Executor, attempt.WorktreePath)

	// Determine executor config
	executorConfig := pm.ResolveExecutorConfig(&attempt.Executor)
	fmt.Printf("Debug: Resolved executor config: %s\n", executorConfig.String())

	// Start the coding agent process
	fmt.Printf("Debug: Starting process execution with CodingAgentType\n")
	err := pm.StartProcessExecution(attemptID, taskID, CodingAgentType{ExecutorConfig: executorConfig}, "Starting executor", attempt.WorktreePath)
	if err != nil {
		fmt.Printf("Debug: Failed to start process execution: %v\n", err)
		return err
	}
	
	fmt.Printf("Debug: Successfully started coding agent for attempt %s\n", attemptID)
	return nil
}

// StartDevServerDirect starts a dev server directly without setup check
func (pm *ProcessManager) StartDevServerDirect(attemptID, taskID, projectID string) error {
	// Get project and attempt
	var project models.VibeProject
	if err := pm.db.First(&project, "id = ?", projectID).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}

	var attempt models.VibeTaskAttempt
	if err := pm.db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		return fmt.Errorf("task attempt not found: %w", err)
	}

	if project.DevScript == "" {
		return fmt.Errorf("no dev script configured for this project")
	}

	// Start dev server
	return pm.StartProcessExecution(attemptID, taskID, DevServerType{Script: project.DevScript}, "Starting dev server", attempt.WorktreePath)
}

// StartFollowupExecutionDirect starts a follow-up execution directly
func (pm *ProcessManager) StartFollowupExecutionDirect(attemptID, taskID, projectID, prompt string) error {
	// Get the most recent coding agent execution to find session
	var processes []models.VibeExecutionProcess
	if err := pm.db.Where("attempt_id = ? AND type = ?", attemptID, "claude").Order("created_at DESC").Find(&processes).Error; err != nil {
		return fmt.Errorf("failed to find previous executions: %w", err)
	}

	if len(processes) == 0 {
		return fmt.Errorf("no previous coding agent execution found for follow-up")
	}

	recentProcess := processes[0]

	// Get executor session to find session ID
	var session models.VibeExecutorSession
	if err := pm.db.First(&session, "execution_process_id = ?", recentProcess.ID).Error; err != nil {
		// No session found, start new session
		return pm.StartCodingAgentDirect(attemptID, taskID, projectID)
	}

	// Get task attempt
	var attempt models.VibeTaskAttempt
	if err := pm.db.First(&attempt, "id = ?", attemptID).Error; err != nil {
		return fmt.Errorf("task attempt not found: %w", err)
	}

	// Determine executor config from the stored process type or attempt executor
	executorConfig := pm.ResolveExecutorConfigFromString(recentProcess.Type)

	// Create follow-up executor with session continuity
	followupType := FollowupCodingAgentType{
		ExecutorConfig: executorConfig,
		SessionID:      session.SessionID,
		Prompt:         prompt,
	}

	return pm.StartProcessExecution(attemptID, taskID, followupType, "Starting follow-up executor", attempt.WorktreePath)
}

// StartProcessExecution starts a process execution with the new executor interface
func (pm *ProcessManager) StartProcessExecution(attemptID, taskID string, executorType ExecutorType, activityNote, worktreePath string) error {
	processID := uuid.NewString()
	fmt.Printf("Debug: StartProcessExecution - processID: %s, attemptID: %s, taskID: %s\n", processID, attemptID, taskID)
	fmt.Printf("Debug: ExecutorType: %T, Config: %s, WorktreePath: %s\n", executorType, executorType.Config().String(), worktreePath)

	// Create execution process record
	fmt.Printf("Debug: Creating execution process record\n")
	_, err := pm.CreateExecutionProcessRecord(attemptID, processID, executorType, worktreePath)
	if err != nil {
		return fmt.Errorf("failed to create process record: %w", err)
	}
	fmt.Printf("Debug: Successfully created execution process record\n")

	// Create executor session for coding agents
	if !executorType.IsFollowup() {
		if _, ok := executorType.(CodingAgentType); ok {
			fmt.Printf("Debug: Creating executor session record for coding agent\n")
			if err := pm.CreateExecutorSessionRecord(attemptID, taskID, processID); err != nil {
				return fmt.Errorf("failed to create session record: %w", err)
			}
			fmt.Printf("Debug: Successfully created executor session record\n")
		}
	}

	// Create and start the executor
	fmt.Printf("Debug: Creating executor from type\n")
	executor := pm.CreateExecutorFromType(executorType)
	fmt.Printf("Debug: Created executor: %T\n", executor)
	
	ctx := context.Background()
	fmt.Printf("Debug: Spawning executor with taskID: %s, worktreePath: %s\n", taskID, worktreePath)
	cmd, err := executor.Spawn(ctx, uuid.MustParse(taskID), worktreePath)
	if err != nil {
		fmt.Printf("Debug: Failed to spawn executor: %v\n", err)
		return fmt.Errorf("failed to spawn executor: %w", err)
	}
	fmt.Printf("Debug: Successfully spawned executor, cmd: %v\n", cmd.String())

	// Create managed process for monitoring
	managedProcess := &ManagedProcess{
		ID:        processID,
		AttemptID: attemptID,
		Type:      executorType.Config().String(),
		Command:   cmd.Path,
		Args:      cmd.Args[1:], // Skip the command itself
		WorkDir:   worktreePath,
		Status:    "running",
		StartTime: time.Now(),
		cmd:       cmd,
		stdout:    NewProcessOutput(),
		stderr:    NewProcessOutput(),
	}

	// Set up output capture
	cmd.Stdout = managedProcess.stdout
	cmd.Stderr = managedProcess.stderr

	pm.mu.Lock()
	pm.processes[processID] = managedProcess
	pm.mu.Unlock()

	// Monitor the process
	go pm.monitorExecutorProcess(managedProcess, executor)

	return nil
}

// monitorExecutorProcess monitors an executor process and handles session extraction
func (pm *ProcessManager) monitorExecutorProcess(mp *ManagedProcess, executor Executor) {
	fmt.Printf("Debug: monitorExecutorProcess started for process %s (attempt %s)\n", mp.ID, mp.AttemptID)
	
	// Start the command
	fmt.Printf("Debug: Starting process command: %s %v\n", mp.cmd.Path, mp.cmd.Args)
	err := mp.cmd.Start()
	if err != nil {
		fmt.Printf("Debug: Failed to start process %s: %v\n", mp.ID, err)
		mp.Status = "failed"
		now := time.Now()
		mp.EndTime = &now
		pm.updateProcessInDB(mp)
		return
	}
	
	fmt.Printf("Debug: Process %s started successfully, PID: %d\n", mp.ID, mp.cmd.Process.Pid)

	// Wait for completion
	fmt.Printf("Debug: Waiting for process %s to complete...\n", mp.ID)
	err = mp.cmd.Wait()
	now := time.Now()
	mp.EndTime = &now

	fmt.Printf("Debug: Process %s completed with error: %v\n", mp.ID, err)

	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			if status, ok := exitError.Sys().(syscall.WaitStatus); ok {
				exitCode := status.ExitStatus()
				mp.ExitCode = &exitCode
				fmt.Printf("Debug: Process %s failed with exit code: %d\n", mp.ID, exitCode)
			}
		}
		mp.Status = "failed"
		fmt.Printf("Debug: Process %s marked as failed\n", mp.ID)
	} else {
		exitCode := 0
		mp.ExitCode = &exitCode
		mp.Status = "completed"
		fmt.Printf("Debug: Process %s completed successfully\n", mp.ID)
	}

	// Get output for debugging
	stdout := mp.stdout.GetOutput()
	stderr := mp.stderr.GetOutput()
	fmt.Printf("Debug: Process %s stdout length: %d, stderr length: %d\n", mp.ID, len(stdout), len(stderr))
	if len(stderr) > 0 {
		fmt.Printf("Debug: Process %s stderr: %s\n", mp.ID, stderr)
	}
	if len(stdout) > 0 && len(stdout) < 1000 {
		fmt.Printf("Debug: Process %s stdout: %s\n", mp.ID, stdout)
	}

	// Extract normalized conversation and session if this is a coding agent
	if strings.Contains(mp.Type, "coding") || mp.Type == "claude" {
		fmt.Printf("Debug: Extracting session from logs for process %s\n", mp.ID)
		go pm.extractSessionFromLogs(mp, executor)
	}

	fmt.Printf("Debug: Updating process %s in database\n", mp.ID)
	pm.updateProcessInDB(mp)
	
	// Update task attempt status based on process completion
	pm.updateTaskAttemptStatus(mp)
	
	fmt.Printf("Debug: monitorExecutorProcess completed for process %s\n", mp.ID)
}

// extractSessionFromLogs extracts session information from executor logs
func (pm *ProcessManager) extractSessionFromLogs(mp *ManagedProcess, executor Executor) {
	logs := mp.stdout.GetOutput()
	if logs == "" {
		return
	}

	// Normalize logs using the executor
	conversation, err := executor.NormalizeLogs(logs, mp.WorkDir)
	if err != nil {
		fmt.Printf("Debug: Failed to normalize logs for process %s: %v\n", mp.ID, err)
		return
	}

	// Update executor session with session ID and conversation
	if conversation.SessionID != nil {
		var session models.VibeExecutorSession
		if err := pm.db.First(&session, "attempt_id = ?", mp.AttemptID).Error; err == nil {
			session.SessionID = *conversation.SessionID
			if conversationJSON, err := json.Marshal(conversation); err == nil {
				// Store conversation in metadata since ConversationLog field doesn't exist
				if session.Metadata == nil {
					session.Metadata = &models.JSONField[map[string]interface{}]{
						Data: make(map[string]interface{}),
					}
				}
				session.Metadata.Data["conversation"] = string(conversationJSON)
			}
			pm.db.Save(&session)
		}
	}
}

// Utility methods for setup and executor management

// IsSetupCompleted checks if setup is completed for a task attempt
func (pm *ProcessManager) IsSetupCompleted(attemptID string) (bool, error) {
	// Check if there's a completed setup process for this attempt
	var process models.VibeExecutionProcess
	err := pm.db.Where("attempt_id = ? AND type = ? AND status = ?", attemptID, "setupscript", "completed").First(&process).Error
	if err == nil {
		return true, nil
	}
	return false, nil
}

// MarkSetupCompleted marks setup as completed for a task attempt
func (pm *ProcessManager) MarkSetupCompleted(attemptID string) error {
	// This is handled by the process status itself - no need to update a separate field
	// The IsSetupCompleted method checks for completed setup processes
	return nil
}

// ShouldRunSetupScript checks if setup script should be executed
func (pm *ProcessManager) ShouldRunSetupScript(project *models.VibeProject) bool {
	return strings.TrimSpace(project.SetupScript) != ""
}

// ResolveExecutorConfig resolves executor configuration from string name
func (pm *ProcessManager) ResolveExecutorConfig(executorName *string) ExecutorConfig {
	if executorName == nil {
		return ExecutorEcho
	}
	return pm.ResolveExecutorConfigFromString(*executorName)
}

// ResolveExecutorConfigFromString resolves executor configuration from string
func (pm *ProcessManager) ResolveExecutorConfigFromString(executorName string) ExecutorConfig {
	switch strings.ToLower(executorName) {
	case "claude":
		return ExecutorClaude
	case "amp":
		return ExecutorAmp
	case "gemini":
		return ExecutorGemini
	case "opencode":
		return ExecutorOpencode
	default:
		return ExecutorEcho
	}
}

// CreateExecutorFromType creates an executor instance from executor type
func (pm *ProcessManager) CreateExecutorFromType(executorType ExecutorType) Executor {
	switch et := executorType.(type) {
	case CodingAgentType:
		return CreateExecutor(et.ExecutorConfig)
	case FollowupCodingAgentType:
		return CreateFollowupExecutor(et.ExecutorConfig, et.SessionID, et.Prompt)
	default:
		return CreateExecutor(ExecutorEcho)
	}
}

// CreateExecutionProcessRecord creates a database record for an execution process
func (pm *ProcessManager) CreateExecutionProcessRecord(attemptID, processID string, executorType ExecutorType, worktreePath string) (*models.VibeExecutionProcess, error) {
	var command string
	var processType string

	switch et := executorType.(type) {
	case CodingAgentType:
		command = "executor"
		processType = et.ExecutorConfig.String()
	case FollowupCodingAgentType:
		command = "followup_executor"
		processType = et.ExecutorConfig.String()
	case SetupScriptType:
		command = "setup_script"
		processType = "setupscript"
	case DevServerType:
		command = "dev_server"
		processType = "devserver"
	default:
		command = "unknown"
		processType = "unknown"
	}

	dbProcess := &models.VibeExecutionProcess{
		Model: models.Model{
			ID: processID,
		},
		AttemptID: attemptID,
		Type:      processType,
		Command:   command,
		Status:    "pending",
	}

	return dbProcess, pm.db.Create(dbProcess).Error
}

// CreateExecutorSessionRecord creates a session record for coding agents
func (pm *ProcessManager) CreateExecutorSessionRecord(attemptID, taskID, processID string) error {
	// Get task to create prompt
	var task models.VibeTask
	if err := pm.db.First(&task, "id = ?", taskID).Error; err != nil {
		return fmt.Errorf("task not found: %w", err)
	}

	// Create prompt from task
	var prompt string
	if task.Description != "" {
		prompt = fmt.Sprintf("%s\n\n%s", task.Title, task.Description)
	} else {
		prompt = task.Title
	}

	sessionID := uuid.NewString()
	session := &models.VibeExecutorSession{
		Model: models.Model{
			ID: sessionID,
		},
		AttemptID: attemptID,
		SessionID: sessionID, // Use the same ID for both
		Executor:  "claude",  // default executor
		Prompt:    prompt,
	}

	return pm.db.Create(session).Error
}

// updateTaskAttemptStatus updates the task attempt status based on process completion
func (pm *ProcessManager) updateTaskAttemptStatus(mp *ManagedProcess) {
	fmt.Printf("Debug: Updating task attempt status for attempt %s based on process %s status: %s\n", mp.AttemptID, mp.ID, mp.Status)
	
	// Get current attempt
	var attempt models.VibeTaskAttempt
	if err := pm.db.First(&attempt, "id = ?", mp.AttemptID).Error; err != nil {
		fmt.Printf("Debug: Failed to find attempt %s: %v\n", mp.AttemptID, err)
		return
	}
	
	// Only update if this is a coding agent process (main execution)
	if !strings.Contains(mp.Type, "coding") && mp.Type != "claude" {
		fmt.Printf("Debug: Skipping attempt status update for non-coding process type: %s\n", mp.Type)
		return
	}
	
	var newStatus string
	var endTime *time.Time
	now := time.Now()
	
	switch mp.Status {
	case "completed":
		newStatus = "completed"
		endTime = &now
		fmt.Printf("Debug: Setting attempt %s to completed\n", mp.AttemptID)
	case "failed":
		newStatus = "failed"
		endTime = &now
		fmt.Printf("Debug: Setting attempt %s to failed\n", mp.AttemptID)
	default:
		fmt.Printf("Debug: No status update needed for process status: %s\n", mp.Status)
		return
	}
	
	// Update attempt status
	updates := map[string]interface{}{
		"status":     newStatus,
		"updated_at": now,
	}
	if endTime != nil {
		updates["end_time"] = endTime
	}
	
	if err := pm.db.Model(&models.VibeTaskAttempt{}).Where("id = ?", mp.AttemptID).Updates(updates).Error; err != nil {
		fmt.Printf("Debug: Failed to update attempt status: %v\n", err)
		return
	}
	
	fmt.Printf("Debug: Successfully updated attempt %s status to %s\n", mp.AttemptID, newStatus)
}

// StartExecution starts the execution flow for a task attempt (main entry point)
func (pm *ProcessManager) StartExecution(attemptID, taskID, projectID, executor, worktreePath string) error {
	fmt.Printf("Debug: Starting execution for attempt %s, task %s, project %s\n", attemptID, taskID, projectID)
	
	// Get project to check if setup script exists
	var project models.VibeProject
	if err := pm.db.First(&project, "id = ?", projectID).Error; err != nil {
		return fmt.Errorf("project not found (ID: %s): %w", projectID, err)
	}
	fmt.Printf("Debug: Found project %s with setup script: %t\n", project.Name, project.SetupScript != "")

	// Check if setup is needed
	needsSetup := pm.ShouldRunSetupScript(&project)
	setupCompleted, err := pm.IsSetupCompleted(attemptID)
	if err != nil {
		return fmt.Errorf("failed to check setup status for attempt %s: %w", attemptID, err)
	}

	fmt.Printf("Debug: Setup needed: %t, Setup completed: %t\n", needsSetup, setupCompleted)

	if needsSetup && !setupCompleted {
		// Start setup script, then continue with coding agent
		fmt.Printf("Debug: Starting setup script with delegation to coding_agent\n")
		return pm.ExecuteSetupWithDelegation(attemptID, taskID, projectID, "coding_agent", nil)
	} else {
		// Start coding agent directly
		fmt.Printf("Debug: Starting coding agent directly\n")
		return pm.StartCodingAgentDirect(attemptID, taskID, projectID)
	}
}