package x

import (
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"path/filepath"
)

func CopyPaths(paths []string, baseDest string) error {
	for _, path := range paths {
		info, err := os.Stat(path)
		if err != nil {
			return fmt.Errorf("error accessing path %s: %w", path, err)
		}

		if info.IsDir() {
			err = copyDir(path, filepath.Join(baseDest, filepath.Base(path)))
		} else {
			err = copyFile(path, filepath.Join(baseDest, filepath.Base(path)))
		}

		if err != nil {
			return fmt.Errorf("error copying %s: %w", path, err)
		}
	}
	return nil
}

func copyDir(srcDir, destDir string) error {
	err := os.MkdirAll(destDir, 0755)
	if err != nil {
		return fmt.Errorf("error creating directory %s: %w", destDir, err)
	}

	entries, err := ioutil.ReadDir(srcDir)
	if err != nil {
		return fmt.Errorf("error reading directory %s: %w", srcDir, err)
	}

	for _, entry := range entries {
		srcPath := filepath.Join(srcDir, entry.Name())
		destPath := filepath.Join(destDir, entry.Name())

		if entry.IsDir() {
			err = copyDir(srcPath, destPath)
		} else {
			err = copyFile(srcPath, destPath)
		}

		if err != nil {
			return fmt.Errorf("error copying %s: %w", srcPath, err)
		}
	}
	return nil
}

func copyFile(src, dest string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return fmt.Errorf("error opening file %s: %w", src, err)
	}
	defer srcFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("error creating file %s: %w", dest, err)
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, srcFile)
	if err != nil {
		return fmt.Errorf("error copying file %s to %s: %w", src, dest, err)
	}

	return nil
}
