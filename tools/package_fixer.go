package tools

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

type Dep struct {
	Name    string
	Version string // empty if not specified
}

type PackageJSON struct {
	Name         string            `json:"name"`
	Version      string            `json:"version"`
	Dependencies map[string]string `json:"dependencies"`
}

// Regex to match imports like: import ... from "foo@1.2.3" or '@scope/foo@1.2.3'
var importRegex = regexp.MustCompile(`(?m)(?:import|require)\s*(?:[\w{}*,\s]+from\s*)?['\"]((@?[\w\-./]+?))(?:@([\w\-.]+))?['\"]`)

// Only match bare imports (not relative or absolute)
func isBareImport(pkg string) bool {
	return !strings.HasPrefix(pkg, ".") && !strings.HasPrefix(pkg, "/")
}

// Use a generic map to preserve all fields
func loadFullPackageJSON(dir string) (map[string]interface{}, map[string]string) {
	pkg := map[string]interface{}{}
	deps := map[string]string{}
	f, err := os.Open(filepath.Join(dir, "package.json"))
	if err != nil {
		return pkg, deps // no package.json
	}
	defer f.Close()
	if err := json.NewDecoder(f).Decode(&pkg); err != nil {
		return pkg, deps
	}
	if d, ok := pkg["dependencies"].(map[string]interface{}); ok {
		for k, v := range d {
			if s, ok := v.(string); ok {
				deps[k] = s
			}
		}
	}
	return pkg, deps
}

// FixImportsAndGeneratePackage processes TypeScript files in the given directory
// to fix imports and generate/update package.json with dependencies
func FixImportsAndGeneratePackage(targetDir string) error {
	// Change to target directory
	originalDir, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("failed to get current directory: %w", err)
	}

	if err := os.Chdir(targetDir); err != nil {
		return fmt.Errorf("failed to change to target directory %s: %w", targetDir, err)
	}
	defer os.Chdir(originalDir)

	var files []string

	// Load existing package.json (all fields)
	pkg, existingDeps := loadFullPackageJSON(".")
	deps := map[string]string{}
	for k, v := range existingDeps {
		deps[k] = v
	}

	// 1. Walk all .ts/.tsx files
	err = filepath.WalkDir(".", func(path string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		if strings.HasSuffix(path, ".ts") || strings.HasSuffix(path, ".tsx") {
			files = append(files, path)
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to walk directory: %w", err)
	}

	processedCount := 0
	changedCount := 0

	for _, file := range files {
		changed, newContent, found := processFile(file, deps)
		if changed {
			if err := os.WriteFile(file, []byte(newContent), 0644); err != nil {
				return fmt.Errorf("failed to write file %s: %w", file, err)
			}
			changedCount++
		}
		if found {
			fmt.Printf("Processed: %s\n", file)
			processedCount++
		}
	}

	// 2. Write package.json (preserving all other fields)
	if err := writeFullPackageJSON(pkg, deps); err != nil {
		return fmt.Errorf("failed to write package.json: %w", err)
	}

	fmt.Printf("\nSummary:\n")
	fmt.Printf("- Processed %d files\n", processedCount)
	fmt.Printf("- Modified %d files\n", changedCount)
	fmt.Printf("- Found %d dependencies\n", len(deps))

	return nil
}

func processFile(path string, deps map[string]string) (changed bool, newContent string, found bool) {
	input, err := os.ReadFile(path)
	if err != nil {
		return false, "", false
	}
	lines := strings.Split(string(input), "\n")
	changed = false
	for i, line := range lines {
		matches := importRegex.FindAllStringSubmatch(line, -1)
		if len(matches) == 0 {
			continue
		}
		for _, m := range matches {
			pkg := m[1]
			ver := m[3]
			if isBareImport(pkg) {
				if ver != "" {
					// Remove @version from import
					old := pkg + "@" + ver
					lines[i] = strings.ReplaceAll(lines[i], old, pkg)
					changed = true
				}
				// Track highest version (lexicographically)
				if v, ok := deps[pkg]; !ok || (ver > v) {
					deps[pkg] = ver
				}
				found = true
			}
		}
	}
	return changed, strings.Join(lines, "\n"), found
}

func writeFullPackageJSON(pkg map[string]interface{}, deps map[string]string) error {
	// Sort keys for stable output
	var keys []string
	for k := range deps {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	newDeps := map[string]string{}
	for _, k := range keys {
		v := deps[k]
		if v == "" {
			v = "*"
		}
		newDeps[k] = v
	}
	pkg["dependencies"] = newDeps
	b, err := json.MarshalIndent(pkg, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile("package.json", b, 0644); err != nil {
		return err
	}
	fmt.Println("Wrote package.json with dependencies (preserved all other fields).")
	return nil
}
