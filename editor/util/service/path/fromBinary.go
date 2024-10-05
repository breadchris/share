package path

import (
	"path/filepath"

	"github.com/kardianos/osext"
)

var (
	executablePath string
	resolveError   error
)

func init() {
	// Get the location of the executing binary
	executablePath, resolveError = osext.ExecutableFolder()
}

/*
FromBinaryIfRelative - Takes a path and, if the path is relative, resolves the path from the
location of the binary file rather than the current working directory. Returns an error when the
path is relative and cannot be resolved.
*/
func FromBinaryIfRelative(path *string) error {
	if !filepath.IsAbs(*path) {
		if resolveError != nil {
			return resolveError
		}
		*path = filepath.Join(executablePath, *path)
	}
	return nil
}

/*
BinaryPath - Returns the path of the executing binary, or an error if it couldn't be resolved.
*/
func BinaryPath() (string, error) {
	return executablePath, resolveError
}
