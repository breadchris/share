/*
Package util provides a few bootstrapping utilities for golang services, and a consistent API to
wrap third parties libraries for things such as stats aggregation and logging.
*/
package service

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v2"
)

/*--------------------------------------------------------------------------------------------------
 */

var (
	version        string
	dateBuilt      string
	showVersion    *bool
	showConfigJSON *bool
	showConfigYAML *bool
	configPath     *string
)

func init() {
	showVersion = flag.Bool("version", false, "Display version info, then exit")
	showConfigJSON = flag.Bool("print-json", false, "Print loaded configuration as JSON, then exit")
	showConfigYAML = flag.Bool("print-yaml", false, "Print loaded configuration as YAML, then exit")
	configPath = flag.String("c", "", "Path to a configuration file")
}

/*--------------------------------------------------------------------------------------------------
 */

func readConfig(path string, config interface{}) error {
	configBytes, err := ioutil.ReadFile(path)
	if err != nil {
		return err
	}
	ext := filepath.Ext(path)
	if ".js" == ext || ".json" == ext {
		if err = json.Unmarshal(configBytes, config); err != nil {
			return err
		}
	} else if ".yml" == ext || ".yaml" == ext {
		if err = yaml.Unmarshal(configBytes, config); err != nil {
			return err
		}
	} else {
		return fmt.Errorf("config file extension not recognised: %v", path)
	}
	return nil
}

/*
Bootstrap - bootstraps the configuration loading, parsing and reporting for a service through cmd
flags. The argument configPtr should be a pointer to a serializable configuration object with all
default values.

configPtr - should be a pointer to a config struct, which contains default values and should be
populated with a users config values if applicable. For an example look at the stats and logger
files.

defaultConfigPaths - if there are known standard configuration paths then you can list them here,
if the user neglects to specify a config then bootstrap will iterate these paths and read the first
one that exists, if any.

Bootstrap allows a user to do the following:
- Print version and build info and exit
- Load an optional configuration file (supports JSON, YAML)
- Print the config file (supports JSON, YAML) and exit

NOTE: The user may request a version and build time stamp, in which case Bootstrap will print the
values of util.Version and util.DateBuilt. To populate those values you must run go build with the
following:

	-ldflags "-X github.com/jeffail/util.version $(VERSION) \
		-X github.com/jeffail/util.dateBuilt $(DATE)"

Returns a flag indicating whether the service should continue or not.
*/
func Bootstrap(configPtr interface{}, defaultConfigPaths ...string) bool {
	// Ensure that cmd flags are parsed.
	if !flag.Parsed() {
		flag.Parse()
	}

	// If the user wants the version we print it.
	if *showVersion {
		fmt.Printf("Version: %v\nDate: %v\n", version, dateBuilt)
		return false
	}

	if len(*configPath) > 0 {
		if err := readConfig(*configPath, configPtr); err != nil {
			fmt.Fprintf(os.Stderr, "Configuration file read error: %v\n", err)
			return false
		}
	} else {
		// Iterate default config paths
		for _, path := range defaultConfigPaths {
			if _, err := os.Stat(path); err == nil {
				fmt.Fprintf(os.Stderr, "Config file not specified, reading from %v\n", path)

				if err = readConfig(path, configPtr); err != nil {
					fmt.Fprintf(os.Stderr, "Configuration file read error: %v\n", err)
					return false
				}
				break
			}
		}
	}

	// If the user wants the configuration to be printed we do so and then exit.
	if *showConfigJSON {
		if configJSON, err := json.MarshalIndent(configPtr, "", "\t"); err == nil {
			fmt.Println(string(configJSON))
		} else {
			fmt.Fprintln(os.Stderr, fmt.Sprintf("Configuration marshal error: %v", err))
		}
		return false
	} else if *showConfigYAML {
		if configYAML, err := yaml.Marshal(configPtr); err == nil {
			fmt.Println(string(configYAML))
		} else {
			fmt.Fprintln(os.Stderr, fmt.Sprintf("Configuration marshal error: %v", err))
		}
		return false
	}
	return true
}

/*--------------------------------------------------------------------------------------------------
 */
