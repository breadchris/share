package xctf

import (
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"
	"time"
)

const dockerTemplate = `FROM {{.BaseImg}}
ADD {{.InputDir}}/ /{{.InputDir}}
CMD sleep infinity
`

const dockerComposeTemplate = `version: "3.9"
services:
{{range .Containers}}
{{.Name}}:
build: ./{{.Name}}
container_name: {{.Name}}
{{end}}
`

// Process simulates an interactive process.
type Process struct {
	Shell  string
	Name   string
	Color  string
	cmd    *exec.Cmd
	stdin  io.WriteCloser
	stdout io.ReadCloser
}

// NewProcess starts an interactive process (using a shell).
func NewProcess(shell, name, color string) (*Process, error) {
	// For simplicity we run the shell command with "sh -c".
	cmd := exec.Command("sh", "-c", shell)
	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	if err := cmd.Start(); err != nil {
		return nil, err
	}
	// (In a real interactive session you might wait for a prompt here.)
	return &Process{
		Shell:  shell,
		Name:   name,
		Color:  color,
		cmd:    cmd,
		stdin:  stdin,
		stdout: stdout,
	}, nil
}

// Run sends a command to the process.
func (p *Process) Run(command string, wait bool, timeout time.Duration, detach bool) error {
	p.Print(fmt.Sprintf("Running command: %s", command))
	_, err := io.WriteString(p.stdin, command+"\n")
	if err != nil {
		return err
	}
	if wait {
		// In this simplified example, we just sleep briefly.
		time.Sleep(500 * time.Millisecond)
		if !detach {
			out, _ := ioutil.ReadAll(p.stdout)
			fmt.Printf("%s", out)
		}
	}
	return nil
}

// Clone creates a new Process using the same shell command.
func (p *Process) Clone() (*Process, error) {
	return NewProcess(p.Shell, p.Name, p.Color)
}

// Print outputs a (possibly colored) log message.
func (p *Process) Print(text string) {
	// For simplicity, color output is not implemented.
	fmt.Printf("[%s] %s\n", p.Name, text)
}

// DockerBuilder builds a Docker image and runs a container.
type DockerBuilder struct {
	Name          string
	BaseImg       string
	InputDir      string
	Color         string
	IncludedFiles []string
	DockerOutputs []string
	OutDir        string
}

// Build creates the Dockerfile and copies input files into the docker context.
func (db *DockerBuilder) Build(dockerContext string) error {
	// Create input directory.
	inputDirPath := filepath.Join(dockerContext, db.InputDir)
	if err := os.Mkdir(inputDirPath, 0755); err != nil {
		return err
	}
	// Copy each included file or directory.
	for _, file := range db.IncludedFiles {
		dest := filepath.Join(inputDirPath, filepath.Base(file))
		fi, err := os.Stat(file)
		if err != nil {
			return err
		}
		if fi.IsDir() {
			if err := copyDir(file, dest); err != nil {
				return err
			}
		} else {
			if err := copyFile(file, dest); err != nil {
				return err
			}
		}
	}
	// Create Dockerfile.
	tmpl, err := template.New("dockerfile").Parse(dockerTemplate)
	if err != nil {
		return err
	}
	var dockerfileBuffer bytes.Buffer
	data := struct {
		BaseImg  string
		InputDir string
	}{
		BaseImg:  db.BaseImg,
		InputDir: db.InputDir,
	}
	if err := tmpl.Execute(&dockerfileBuffer, data); err != nil {
		return err
	}
	dockerfilePath := filepath.Join(dockerContext, "Dockerfile")
	return ioutil.WriteFile(dockerfilePath, dockerfileBuffer.Bytes(), 0644)
}

// Start builds the Docker image and runs a container, returning an interactive process and a cleanup function.
func (db *DockerBuilder) Start() (*Process, func() error, error) {
	// Create temporary directory for docker context.
	tempDir, err := ioutil.TempDir("", "docker_context")
	if err != nil {
		return nil, nil, err
	}
	// Build the docker context.
	if err := db.Build(tempDir); err != nil {
		return nil, nil, err
	}
	// Build docker image.
	buildCmd := exec.Command("docker", "build", "--platform", "linux/amd64", "-q", tempDir, "-t", db.Name)
	if out, err := buildCmd.CombinedOutput(); err != nil {
		return nil, nil, fmt.Errorf("docker build failed: %s", string(out))
	}
	// Run container.
	runCmd := exec.Command("docker", "run", "-d", "--name", db.Name, db.Name)
	if out, err := runCmd.CombinedOutput(); err != nil {
		return nil, nil, fmt.Errorf("docker run failed: %s", string(out))
	}
	// Create interactive process.
	proc, err := NewProcess(fmt.Sprintf("docker exec -it %s /bin/sh", db.Name), "container", db.Color)
	if err != nil {
		return nil, nil, err
	}
	// Cleanup function.
	cleanup := func() error {
		for _, file := range db.DockerOutputs {
			cmd := exec.Command("docker", "cp", fmt.Sprintf("%s:%s", db.Name, file), db.OutDir)
			if out, err := cmd.CombinedOutput(); err != nil {
				log.Printf("docker cp failed: %s", string(out))
			}
		}
		rmCmd := exec.Command("docker", "rm", "-f", "-v", db.Name)
		if out, err := rmCmd.CombinedOutput(); err != nil {
			log.Printf("docker rm failed: %s", string(out))
		}
		rmiCmd := exec.Command("docker", "rmi", "-f", db.Name)
		if out, err := rmiCmd.CombinedOutput(); err != nil {
			log.Printf("docker rmi failed: %s", string(out))
		}
		return os.RemoveAll(tempDir)
	}
	return proc, cleanup, nil
}

// DockerNetwork sets up a network environment using docker-compose.
type DockerNetwork struct {
	Containers    []*DockerBuilder
	OutDir        string
	DockerOutputs map[string][]string
	tempDir       string
}

// Start creates a docker-compose file, builds all containers, and brings the network up.
func (dn *DockerNetwork) Start() ([]*Process, func() error, error) {
	// Create a temporary directory.
	tempDir, err := ioutil.TempDir("", "docker_network")
	if err != nil {
		return nil, nil, err
	}
	dn.tempDir = tempDir
	// Build each container's docker context.
	for _, container := range dn.Containers {
		imageDir := filepath.Join(tempDir, container.Name)
		if err := os.Mkdir(imageDir, 0755); err != nil {
			return nil, nil, err
		}
		if err := container.Build(imageDir); err != nil {
			return nil, nil, err
		}
	}
	// Render docker-compose file.
	tmpl, err := template.New("dockerCompose").Parse(dockerComposeTemplate)
	if err != nil {
		return nil, nil, err
	}
	var dcBuffer bytes.Buffer
	data := struct {
		Containers []*DockerBuilder
	}{
		Containers: dn.Containers,
	}
	if err := tmpl.Execute(&dcBuffer, data); err != nil {
		return nil, nil, err
	}
	dcPath := filepath.Join(tempDir, "docker-compose.yml")
	if err := ioutil.WriteFile(dcPath, dcBuffer.Bytes(), 0644); err != nil {
		return nil, nil, err
	}
	// Bring up the network.
	upCmd := exec.Command("docker-compose", "-p", "temp", "up", "--build", "--detach")
	upCmd.Dir = tempDir
	if out, err := upCmd.CombinedOutput(); err != nil {
		return nil, nil, fmt.Errorf("docker-compose up failed: %s", string(out))
	}
	// Create a Process for each container.
	var procs []*Process
	for _, container := range dn.Containers {
		proc, err := NewProcess(fmt.Sprintf("docker exec -it %s /bin/sh", container.Name), container.Name, container.Color)
		if err != nil {
			return nil, nil, err
		}
		procs = append(procs, proc)
	}
	cleanup := func() error {
		for name, files := range dn.DockerOutputs {
			for _, file := range files {
				cmd := exec.Command("docker", "cp", fmt.Sprintf("%s:%s", name, file), dn.OutDir)
				if out, err := cmd.CombinedOutput(); err != nil {
					log.Printf("docker cp failed: %s", string(out))
				}
			}
		}
		downCmd := exec.Command("docker-compose", "-p", "temp", "down", "--rmi", "all")
		downCmd.Dir = tempDir
		if out, err := downCmd.CombinedOutput(); err != nil {
			log.Printf("docker-compose down failed: %s", string(out))
		}
		return os.RemoveAll(tempDir)
	}
	return procs, cleanup, nil
}

// Helper functions to copy files and directories.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func copyDir(src, dst string) error {
	entries, err := ioutil.ReadDir(src)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}
	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())
		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFile(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}

// PCAPLogin simulates the challenge generation for a PCAP login challenge.
func PCAPLogin(chalDir, username, password, outFile, flag, flagTransform string) error {
	// Create a temporary directory for challenge files.
	tempDir, err := ioutil.TempDir("", "pcap_login")
	if err != nil {
		return err
	}
	defer os.RemoveAll(tempDir)

	// Simulate creating an index.php file using templating.
	indexContent := fmt.Sprintf("<?php\n// login page for %s with password %s\n", username, password)
	indexPath := filepath.Join(tempDir, "index.php")
	if err := ioutil.WriteFile(indexPath, []byte(indexContent), 0644); err != nil {
		return err
	}

	// Set up Docker builders.
	sender := &DockerBuilder{
		Name:    "sender",
		BaseImg: "nicolaka/netshoot",
	}
	recv := &DockerBuilder{
		Name:          "recv",
		BaseImg:       "php:8.0-apache",
		IncludedFiles: []string{indexPath},
		Color:         "white",
	}
	network := DockerNetwork{
		Containers:    []*DockerBuilder{sender, recv},
		OutDir:        outFile,
		DockerOutputs: map[string][]string{"sender": {fmt.Sprintf("/root/%s", outFile)}},
	}
	hosts, cleanup, err := network.Start()
	if err != nil {
		return err
	}
	defer cleanup()

	send := hosts[0]
	php := hosts[1]

	tcpdump, err := send.Clone()
	if err != nil {
		return err
	}
	tcpdump.Run(fmt.Sprintf("tcpdump -q -w %s", outFile), true, 600*time.Second, true)
	php.Run("mv /input/index.php /var/www/html/index.php", true, 600*time.Second, true)
	php.Run("service apache2 start", true, 600*time.Second, true)

	// Try random username/password combinations.
	randCount := rand.Intn(11) + 10
	for i := 0; i < randCount; i++ {
		randomUser := randString(10)
		randomPass := randString(10)
		send.Run(fmt.Sprintf("curl -X POST -d \"username=%s&password=%s\" recv", randomUser, randomPass), true, 600*time.Second, true)
	}
	// Use the actual credentials.
	transformedFlag := flag
	if flagTransform != "" {
		// Dummy transformation (e.g. uppercase) for illustration.
		transformedFlag = strings.ToUpper(flag)
	}
	send.Run(fmt.Sprintf("curl -X POST -d \"username=%s&password=%s&flag=%s\" recv", username, password, transformedFlag), true, 600*time.Second, true)
	// More random attempts.
	randCount = rand.Intn(11) + 10
	for i := 0; i < randCount; i++ {
		randomUser := randString(10)
		randomPass := randString(10)
		send.Run(fmt.Sprintf("curl -X POST -d \"username=%s&password=%s\" recv", randomUser, randomPass), true, 600*time.Second, true)
	}
	time.Sleep(10 * time.Second)
	// Stop tcpdump by sending a control character (simulate Ctrl-C).
	tcpdump.Run(string(3), true, 600*time.Second, true)

	fmt.Println("Finished PCAPLogin challenge generation.")
	return nil
}

// PingPCAP simulates the generation of a ping-based PCAP challenge.
func PingPCAP(chalDir, text, flag string) error {
	// Transform flag to hex.
	flagHex := fmt.Sprintf("%x", text+flag)
	// Split flagHex into byte pairs.
	var flagBytes []string
	for i := 0; i < len(flagHex); i += 2 {
		end := i + 2
		if end > len(flagHex) {
			end = len(flagHex)
		}
		flagBytes = append(flagBytes, flagHex[i:end])
	}

	//out := filepath.Join(chalDir, "chal.pcap")
	sender := &DockerBuilder{
		Name:    "sender",
		BaseImg: "nicolaka/netshoot",
	}
	recv := &DockerBuilder{
		Name:    "recv",
		BaseImg: "alpine",
	}
	network := DockerNetwork{
		Containers:    []*DockerBuilder{sender, recv},
		OutDir:        chalDir,
		DockerOutputs: map[string][]string{"sender": {"/root/chal.pcap"}},
	}
	hosts, cleanup, err := network.Start()
	if err != nil {
		return err
	}
	defer cleanup()

	send := hosts[0]
	tcpdump, err := send.Clone()
	if err != nil {
		return err
	}
	tcpdump.Run("tcpdump -q -w chal.pcap", true, 600*time.Second, true)

	websites := []string{"stackoverflow.com", "twitter.com", "github.com", "facebook.com", "google.com"}
	userAgent := `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36`
	send.Run(fmt.Sprintf("curl -L -A \"%s\" %s", userAgent, websites[rand.Intn(len(websites))]), true, 600*time.Second, true)
	for _, b := range flagBytes {
		send.Run(fmt.Sprintf("ping -c 1 -p %s recv", b), true, 600*time.Second, true)
		r := rand.Intn(10) + 1
		if r == 4 {
			send.Run("ping -c 1 -w 1 195.168.233.233", true, 600*time.Second, true)
		} else if r == 5 {
			send.Run(fmt.Sprintf("curl -L -A \"%s\" %s", userAgent, websites[rand.Intn(len(websites))]), true, 600*time.Second, true)
		} else if r == 6 {
			send.Run(fmt.Sprintf("curl -X POST -A \"%s\" -d \"flag=nottheflag123\" recv", userAgent), true, 600*time.Second, true)
		}
	}
	time.Sleep(10 * time.Second)
	tcpdump.Run(string(3), true, 600*time.Second, true)

	fmt.Println("Finished PingPCAP challenge generation.")
	return nil
}

func randString(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
	b := make([]rune, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}
