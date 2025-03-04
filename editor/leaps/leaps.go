package leaps

import (
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/editor/acl"
	"github.com/breadchris/share/editor/api"
	io3 "github.com/breadchris/share/editor/api/io"
	"github.com/breadchris/share/editor/auditor"
	"github.com/breadchris/share/editor/curator"
	"github.com/breadchris/share/editor/store"
	"github.com/breadchris/share/editor/util"
	"github.com/breadchris/share/editor/util/service/log"
	"github.com/breadchris/share/editor/util/service/metrics"
	"github.com/breadchris/share/html"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	gopath "path"
	"path/filepath"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

type Leaps struct {
	Authenticator *acl.FileExists
	Mux           *http.ServeMux
}

type cmdList []string

func (c *cmdList) String() string {
	return strings.Join(*c, ", ")
}

func (c *cmdList) Set(value string) error {
	*c = append(*c, value)
	return nil
}

var (
	httpAddress string
	applyLcot   bool
	discardLcot bool
	showHidden  bool
	debugWWWDir string
	logLevel    string
	subdirPath  string
	cmds        cmdList
	allowWrites bool
)

// Build Information
var (
	version   = "0.0.0"
	dateBuilt = "-"
)

func init() {
	applyLcot = false
	allowWrites = true
	discardLcot = false
	showHidden = false
	httpAddress = "localhost:8080"
	logLevel = "INFO"
	subdirPath = "/"
	cmds = cmdList{}
	//debugWWWDir = "./editor/javascript"
	debugWWWDir = ""
}

var endpoints = []interface{}{}

func handle(mux *http.ServeMux, path, description string, handler http.HandlerFunc) {
	path = gopath.Join("/", subdirPath, path)
	mux.HandleFunc(path, handler)
	endpoints = append(endpoints, struct {
		Path string `json:"path"`
		Desc string `json:"description"`
	}{
		Path: path,
		Desc: description,
	})
}

func writeAudit(path string, auditor *auditor.ToJSON) error {
	data, err := auditor.Serialise()
	if err != nil {
		return err
	}
	return ioutil.WriteFile(path, data, 0644)
}

func readAudit(path string, auditor *auditor.ToJSON, docStore store.Type) error {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	if err = auditor.Deserialise(data); err != nil {
		return err
	}
	return auditor.Reapply(docStore)
}

type shellRunner struct{}

func (s shellRunner) CMDRun(cmdStr string) (stdout, stderr []byte, err error) {
	var errRead, outRead io.ReadCloser

	cmd := exec.Command("sh", "-c", cmdStr)

	if outRead, err = cmd.StdoutPipe(); err != nil {
		return
	}
	if errRead, err = cmd.StderrPipe(); err != nil {
		return
	}
	if err = cmd.Start(); err != nil {
		return
	}
	if stdout, err = ioutil.ReadAll(outRead); err != nil {
		return
	}
	if stderr, err = ioutil.ReadAll(errRead); err != nil {
		return
	}
	if err = cmd.Wait(); err != nil {
		return
	}
	return
}

func NewLogger() log.Modular {
	logConf := log.NewLoggerConfig()
	logConf.Prefix = "leaps"
	logConf.LogLevel = logLevel
	return log.NewLogger(os.Stdout, logConf)
}

func NewLeaps() {
	logger := NewLogger()

	m := RegisterRoutes(logger)

	http.Handle("/", m.Mux)

	logger.Infoln("Launching a leaps instance, use CTRL+C to close.")

	logger.Infof("Serving HTTP requests at: %v%v\n", httpAddress, subdirPath)
	if httperr := http.ListenAndServe(httpAddress, nil); httperr != nil {
		fmt.Fprintln(os.Stderr, fmt.Sprintf("HTTP listen error: %v\n", httperr))
	}
}

func RegisterRoutes(logger log.Modular) *Leaps {
	mux := http.NewServeMux()

	targetPath := "."

	leapsCOTPath := filepath.Join(targetPath, ".leaps_cot.json")

	statConf := metrics.NewConfig()
	statConf.Type = "http"
	statConf.HTTP.Prefix = "leaps"

	stats, err := metrics.NewHTTP(statConf)
	if err != nil {
		fmt.Fprintln(os.Stderr, fmt.Sprintf("Metrics init error: %v\n", err))
		return nil
	}
	defer stats.Close()

	// Document storage engine
	docStore, err := store.NewFile(targetPath, allowWrites)
	if err != nil {
		fmt.Fprintln(os.Stderr, fmt.Sprintf("Document store error: %v\n", err))
		os.Exit(1)
	}

	// Authenticator
	storeConf := acl.NewFileExistsConfig()
	storeConf.Path = targetPath
	storeConf.ShowHidden = showHidden
	storeConf.ReservedIgnores = append(storeConf.ReservedIgnores, leapsCOTPath)

	authenticator := acl.NewFileExists(storeConf, logger)

	// Auditors
	auditors := auditor.NewToJSON()

	// This flag means the user wants uncommitted changes to be written to disk
	// and then we exit.
	if applyLcot {
		if err := readAudit(leapsCOTPath, auditors, docStore); err != nil && !os.IsNotExist(err) {
			logger.Errorf("Failed to read previously uncommitted changes: %v\n", err)
			os.Exit(1)
		}
		if err := os.Remove(leapsCOTPath); err != nil && !os.IsNotExist(err) {
			logger.Errorf("Changes were successfully committed, but the old audit was not removed: %v\n", err)
			logger.Errorf("You should remove %v manually before running leaps again\n", leapsCOTPath)
			os.Exit(1)
		}
		logger.Infoln("Successfully committed changes to disk.")
		os.Exit(0)
	}

	// This flag means the user wants uncommitted changes to be deleted, and
	// then we exit.
	if discardLcot {
		if err := os.Remove(leapsCOTPath); err != nil && !os.IsNotExist(err) {
			logger.Errorf("Failed to remove %v: %v\n", leapsCOTPath, err)
			os.Exit(1)
		}
		logger.Infoln("Successfully discarded changes.")
		os.Exit(0)
	}

	// Curator of documents
	curatorConf := curator.NewConfig()
	curator, err := curator.New(curatorConf, logger, stats, authenticator, docStore, auditors)
	if err != nil {
		fmt.Fprintln(os.Stderr, fmt.Sprintf("Curator error: %v\n", err))
		os.Exit(1)
	}
	// TODO clean up
	//defer curator.Close()

	handle(mux, "/endpoints", "Lists all available endpoints (including this one).",
		func(w http.ResponseWriter, r *http.Request) {
			data, reqErr := json.Marshal(endpoints)
			if reqErr != nil {
				logger.Errorf("Failed to serve endpoints: %v\n", reqErr)
				http.Error(w, reqErr.Error(), http.StatusInternalServerError)
				return
			}
			w.Header().Add("Content-Type", "application/json")
			w.Write(data)
		})

	handle(mux, "/files", "Returns a list of available files and a map of users per document.",
		func(w http.ResponseWriter, r *http.Request) {
			//data, err := json.Marshal(struct {
			//	Paths []string          `json:"paths"`
			//	Users map[string]string `json:"users"`
			//}{
			//	Paths: authenticator.GetPaths(),
			//	Users: map[string]string{},
			//})
			//if err != nil {
			//	http.Error(w, err.Error(), http.StatusInternalServerError)
			//	logger.Errorf("Failed to serve users: %v\n", err)
			//	return
			//}
			//w.Header().Add("Content-Type", "application/json")
			//w.Write(data)

			w.Write([]byte(
				html.RenderTabs(html.Tab{
					Title:   "files",
					Content: html.GenerateRenderDirectory(authenticator.GetPaths()),
					Active:  true,
				}).Render(),
			))
		})

	if hStats, ok := stats.(*metrics.HTTP); ok {
		handle(mux, "/stats", "Lists all aggregated metrics as a json blob.", hStats.JSONHandler())
	}

	//if len(debugWWWDir) > 0 {
	//	wwwPath := gopath.Join("/", subdirPath)
	//	stripPath := ""
	//	if wwwPath != "/" {
	//		wwwPath = wwwPath + "/"
	//		stripPath = wwwPath
	//	}
	//	logger.Warnf("Serving web files from alternative www dir: %v\n", debugWWWDir)
	//	http.Handle(wwwPath, http.StripPrefix(stripPath, http.FileServer(http.Dir(debugWWWDir))))
	//}
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./editor/javascript"))))

	globalBroker := api.NewGlobalMetadataBroker(time.Second*300, logger, stats)
	cmdBroker := api.NewCMDBroker(cmds, shellRunner{}, time.Second*300, logger, stats)

	handle(mux, "/ws", "websocket", func(w http.ResponseWriter, r *http.Request) {
		username := r.URL.Query().Get("username")
		uuid := util.GenerateUUID()

		if len(username) == 0 {
			http.Error(w, "Expected username header value in request", http.StatusBadRequest)
			logger.Errorln("Failed to create websocket: no username provided")
			return
		}

		conn, err := (&websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		}).Upgrade(w, r, nil)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			logger.Errorf("Failed to create websocket: %v\n", err)
			return
		}

		jsonEmitter := io3.NewJSONEmitter(&io3.ConcurrentJSON{C: conn})
		globalBroker.NewEmitter(username, uuid, jsonEmitter)
		cmdBroker.NewEmitter(username, uuid, jsonEmitter)
		api.NewCuratorSession(username, uuid, jsonEmitter, curator, time.Second*300, logger, stats)

		jsonEmitter.ListenAndEmit()
	})
	return &Leaps{
		Authenticator: authenticator,
		Mux:           mux,
	}
}
