package plugin

import (
	"fmt"
	"github.com/wasmerio/wasmer-go/wasmer"
	"log"
	"os"
	"os/exec"
	"testing"

	"github.com/fsnotify/fsnotify"
)

func CompileToWasm(sourceFile string, wasmOutputFile string) error {
	cmd := exec.Command("tinygo", "build", "-o", wasmOutputFile, "-target", "wasi", sourceFile)
	o, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to compile to WASM: %s", o)
	}
	fmt.Println("WASM compiled successfully!")
	return nil
}

func RunWasm(wasmFile string) error {
	wasmBytes, err := os.ReadFile(wasmFile)
	if err != nil {
		return fmt.Errorf("failed to read WASM file: %w", err)
	}

	engine := wasmer.NewEngine()
	store := wasmer.NewStore(engine)

	// Compiles the module
	module, err := wasmer.NewModule(store, wasmBytes)
	if err != nil {
		return fmt.Errorf("failed to compile module: %w", err)
	}

	wasiEnv, err := wasmer.NewWasiStateBuilder("wasi-program").Finalize()
	if err != nil {
		return fmt.Errorf("failed to create WASI environment: %w", err)
	}

	// Instantiates the module
	importObject, err := wasiEnv.GenerateImportObject(store, module)
	if err != nil {
		return fmt.Errorf("failed to generate import object: %w", err)
	}
	instance, err := wasmer.NewInstance(module, importObject)
	if err != nil {
		return fmt.Errorf("failed to instantiate module: %w", err)
	}

	// Gets the `sum` exported function from the WebAssembly instance.
	start, err := instance.Exports.GetWasiStartFunction()
	if err != nil {
		return fmt.Errorf("failed to get function 'Test': %w", err)
	}
	start()

	//mainFunction, err := instance.Exports.GetFunction("main")
	//if err != nil {
	//	return fmt.Errorf("failed to get function 'main': %w", err)
	//}
	//
	//_, err = mainFunction()
	//if err != nil {
	//	return fmt.Errorf("failed to execute function 'main': %w", err)
	//}

	fmt.Println("WASM executed successfully!")
	return nil
}

// WatchFile watches a file and triggers recompilation and execution on changes
func WatchFile(sourceFile, wasmOutputFile string) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	defer watcher.Close()

	done := make(chan bool)

	go func() {
		for {
			select {
			case event := <-watcher.Events:
				if event.Op&fsnotify.Write == fsnotify.Write {
					fmt.Println("File modified:", event.Name)

					// Compile to WASM
					err := CompileToWasm(sourceFile, wasmOutputFile)
					if err != nil {
						fmt.Println("Error compiling WASM:", err)
					}

					// Run the compiled WASM
					err = RunWasm(wasmOutputFile)
					if err != nil {
						fmt.Println("Error running WASM:", err)
					}
				}
			case err := <-watcher.Errors:
				fmt.Println("Error:", err)
			}
		}
	}()

	err = watcher.Add(sourceFile)
	if err != nil {
		log.Fatal(err)
	}
	<-done
}

func TestPlugin(t *testing.T) {
	sourceFile := "./plugin/plugin.go" // path to the plugin Go source file
	wasmOutputFile := "./plugin.wasm"  // path to the compiled WASM output

	// Compile and run the plugin for the first time
	err := CompileToWasm(sourceFile, wasmOutputFile)
	if err != nil {
		log.Fatalf("Initial compilation failed: %v", err)
	}

	// Run the compiled WASM
	err = RunWasm(wasmOutputFile)
	if err != nil {
		log.Fatalf("Initial run failed: %v", err)
	}

	// Start watching the file for changes
	fmt.Println("Watching for changes...")
	WatchFile(sourceFile, wasmOutputFile)
}
