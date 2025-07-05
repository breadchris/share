package deploy

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"github.com/breadchris/share/models"
)

// performDeployment executes the full deployment process
func (dm *DeploymentManager) performDeployment(commitHash, userID string) error {
	// Create deployment record
	deployment, err := dm.createDeployment(commitHash, userID)
	if err != nil {
		return fmt.Errorf("failed to create deployment record: %w", err)
	}

	dm.appendLog(deployment, "Starting deployment for commit "+commitHash)
	deployment.Status = string(StatusBuilding)
	dm.updateDeployment(deployment)

	// Step 1: Pull latest changes and build
	if err := dm.buildNewVersion(deployment, commitHash); err != nil {
		deployment.Status = string(StatusFailed)
		dm.appendLog(deployment, "Build failed: "+err.Error())
		dm.updateDeployment(deployment)
		return fmt.Errorf("build failed: %w", err)
	}

	// Step 2: Start new process
	deployment.Status = string(StatusDeploying)
	dm.updateDeployment(deployment)

	newProcess, err := dm.startNewProcess(deployment)
	if err != nil {
		deployment.Status = string(StatusFailed)
		dm.appendLog(deployment, "Failed to start new process: "+err.Error())
		dm.updateDeployment(deployment)
		return fmt.Errorf("failed to start new process: %w", err)
	}

	// Step 3: Health check
	if err := dm.waitForHealthy(newProcess, deployment); err != nil {
		dm.appendLog(deployment, "Health check failed: "+err.Error())
		dm.stopProcess(newProcess)
		deployment.Status = string(StatusFailed)
		dm.updateDeployment(deployment)
		return fmt.Errorf("health check failed: %w", err)
	}

	// Step 4: Swap processes
	dm.swapProcess(newProcess, deployment)

	// Step 5: Mark deployment as successful
	deployment.Status = string(StatusSuccess)
	deployment.ProcessID = newProcess.PID
	deployment.Port = newProcess.Port
	deployment.HealthURL = newProcess.HealthURL
	endTime := time.Now()
	deployment.EndTime = &endTime
	dm.appendLog(deployment, "Deployment completed successfully")
	dm.updateDeployment(deployment)

	slog.Info("Deployment completed successfully", 
		"deployment_id", deployment.ID, 
		"commit", commitHash,
		"pid", newProcess.PID,
		"port", newProcess.Port)

	return nil
}

// performRollback executes a rollback to a previous deployment
func (dm *DeploymentManager) performRollback(targetCommitHash, userID, targetDeploymentID string) error {
	// Create new deployment record for the rollback
	deployment, err := dm.createDeployment(targetCommitHash, userID)
	if err != nil {
		return fmt.Errorf("failed to create rollback deployment record: %w", err)
	}

	dm.appendLog(deployment, "Starting rollback to commit "+targetCommitHash+" (deployment "+targetDeploymentID+")")
	deployment.Status = string(StatusBuilding)
	dm.updateDeployment(deployment)

	// Build the target version
	if err := dm.buildNewVersion(deployment, targetCommitHash); err != nil {
		deployment.Status = string(StatusFailed)
		dm.appendLog(deployment, "Rollback build failed: "+err.Error())
		dm.updateDeployment(deployment)
		return fmt.Errorf("rollback build failed: %w", err)
	}

	// Start new process
	deployment.Status = string(StatusDeploying)
	dm.updateDeployment(deployment)

	newProcess, err := dm.startNewProcess(deployment)
	if err != nil {
		deployment.Status = string(StatusFailed)
		dm.appendLog(deployment, "Failed to start rollback process: "+err.Error())
		dm.updateDeployment(deployment)
		return fmt.Errorf("failed to start rollback process: %w", err)
	}

	// Health check
	if err := dm.waitForHealthy(newProcess, deployment); err != nil {
		dm.appendLog(deployment, "Rollback health check failed: "+err.Error())
		dm.stopProcess(newProcess)
		deployment.Status = string(StatusFailed)
		dm.updateDeployment(deployment)
		return fmt.Errorf("rollback health check failed: %w", err)
	}

	// Swap processes
	dm.swapProcess(newProcess, deployment)

	// Mark as rolled back
	deployment.Status = string(StatusRolledBack)
	deployment.ProcessID = newProcess.PID
	deployment.Port = newProcess.Port
	deployment.HealthURL = newProcess.HealthURL
	endTime := time.Now()
	deployment.EndTime = &endTime
	dm.appendLog(deployment, "Rollback completed successfully")
	dm.updateDeployment(deployment)

	slog.Info("Rollback completed successfully", 
		"deployment_id", deployment.ID, 
		"target_commit", targetCommitHash,
		"target_deployment", targetDeploymentID,
		"pid", newProcess.PID,
		"port", newProcess.Port)

	return nil
}

// buildNewVersion pulls the latest code and builds the binary
func (dm *DeploymentManager) buildNewVersion(deployment *models.Deployment, commitHash string) error {
	workDir := dm.deps.Config.DeploymentWorkDir()

	// Ensure work directory exists
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return fmt.Errorf("failed to create work directory: %w", err)
	}

	dm.appendLog(deployment, "Pulling latest changes...")

	// Git pull
	cmd := exec.Command("git", "pull", "origin", "master")
	cmd.Dir = "." // Current directory (assuming we're in the repo)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("git pull failed: %w, output: %s", err, output)
	}
	dm.appendLog(deployment, "Git pull completed: "+string(output))

	// Checkout specific commit
	if commitHash != "" {
		cmd = exec.Command("git", "checkout", commitHash)
		cmd.Dir = "."
		output, err = cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("git checkout failed: %w, output: %s", err, output)
		}
		dm.appendLog(deployment, "Checked out commit "+commitHash)
	}

	dm.appendLog(deployment, "Building new binary...")

	// Build new binary
	binaryPath := filepath.Join(workDir, "server-"+deployment.ID)
	cmd = exec.Command("go", "build", "-o", binaryPath, ".")
	cmd.Dir = "."
	output, err = cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("build failed: %w, output: %s", err, output)
	}
	dm.appendLog(deployment, "Build completed successfully")

	return nil
}

// startNewProcess starts a new server process on a different port
func (dm *DeploymentManager) startNewProcess(deployment *models.Deployment) (*ProcessInfo, error) {
	// Find available port
	port, err := dm.findAvailablePort()
	if err != nil {
		return nil, fmt.Errorf("failed to find available port: %w", err)
	}

	workDir := dm.deps.Config.DeploymentWorkDir()

	binaryPath := filepath.Join(workDir, "server-"+deployment.ID)
	
	dm.appendLog(deployment, fmt.Sprintf("Starting new process on port %d", port))

	// Start the new process
	cmd := exec.Command(binaryPath, "start", "--port", strconv.Itoa(port))
	cmd.Dir = "." // Start in current directory to access data files
	
	// Set environment variables
	cmd.Env = append(os.Environ(),
		"PORT="+strconv.Itoa(port),
		"DEPLOYMENT_ID="+deployment.ID,
	)

	// Start the process
	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start process: %w", err)
	}

	processInfo := &ProcessInfo{
		PID:          cmd.Process.Pid,
		Port:         port,
		StartTime:    time.Now(),
		HealthURL:    fmt.Sprintf("http://localhost:%d/deploy/health", port),
		Process:      cmd.Process,
		DeploymentID: deployment.ID,
	}

	dm.appendLog(deployment, fmt.Sprintf("Process started with PID %d", processInfo.PID))

	return processInfo, nil
}

// findAvailablePort finds an available port for the new process
func (dm *DeploymentManager) findAvailablePort() (int, error) {
	// Start checking from port 8081 (assuming 8080 is the main port)
	for port := 8081; port <= 8090; port++ {
		listener, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
		if err == nil {
			listener.Close()
			return port, nil
		}
	}
	return 0, fmt.Errorf("no available ports found in range 8081-8090")
}

// waitForHealthy waits for the new process to become healthy
func (dm *DeploymentManager) waitForHealthy(process *ProcessInfo, deployment *models.Deployment) error {
	dm.appendLog(deployment, "Waiting for process to become healthy...")

	timeout := time.Duration(dm.deps.Config.DeploymentHealthTimeout()) * time.Second

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return fmt.Errorf("health check timed out after %v", timeout)
		case <-ticker.C:
			resp, err := client.Get(process.HealthURL)
			if err == nil && resp.StatusCode == http.StatusOK {
				resp.Body.Close()
				dm.appendLog(deployment, "Process is healthy")
				return nil
			}
			if resp != nil {
				resp.Body.Close()
			}
			dm.appendLog(deployment, fmt.Sprintf("Health check failed, retrying... (error: %v)", err))
		}
	}
}

// swapProcess swaps the current process with the new one
func (dm *DeploymentManager) swapProcess(newProcess *ProcessInfo, deployment *models.Deployment) {
	dm.mu.Lock()
	defer dm.mu.Unlock()

	oldProcess := dm.currentProcess

	// Update current process
	dm.currentProcess = newProcess
	dm.appendLog(deployment, fmt.Sprintf("Swapped to new process (PID %d, Port %d)", newProcess.PID, newProcess.Port))

	// Gracefully stop the old process
	if oldProcess != nil {
		go func() {
			dm.appendLog(deployment, fmt.Sprintf("Gracefully stopping old process (PID %d)", oldProcess.PID))
			dm.stopProcess(oldProcess)
		}()
	}
}

// stopProcess gracefully stops a process
func (dm *DeploymentManager) stopProcess(process *ProcessInfo) {
	if process == nil || process.Process == nil {
		return
	}

	slog.Info("Stopping process", "pid", process.PID)

	// Send SIGTERM for graceful shutdown
	if err := process.Process.Signal(syscall.SIGTERM); err != nil {
		slog.Error("Failed to send SIGTERM", "pid", process.PID, "error", err)
		// Force kill if SIGTERM fails
		process.Process.Kill()
		return
	}

	// Wait for graceful shutdown with timeout
	done := make(chan error, 1)
	go func() {
		_, err := process.Process.Wait()
		done <- err
	}()

	timeout := time.Duration(dm.deps.Config.DeploymentGracefulTimeout()) * time.Second

	select {
	case <-done:
		slog.Info("Process stopped gracefully", "pid", process.PID)
	case <-time.After(timeout):
		slog.Warn("Process did not stop gracefully, force killing", "pid", process.PID)
		process.Process.Kill()
		process.Process.Wait()
	}
}

// getLatestCommitHash gets the latest commit hash from the repository
func (dm *DeploymentManager) getLatestCommitHash() (string, error) {
	cmd := exec.Command("git", "rev-parse", "HEAD")
	cmd.Dir = "."
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get commit hash: %w", err)
	}
	
	return string(output[:40]), nil // First 40 characters (full SHA)
}