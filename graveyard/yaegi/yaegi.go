package yaegi

import (
	"bufio"
	"bytes"
	"github.com/breadchris/yaegi/interp"
	"regexp"
	"strconv"
)

type Debug struct {
	Interp *interp.Interpreter
}

func (d Debug) DoGetStack() ([]StackFrame, error) {
	filteredStack := d.Interp.FilteredStack()
	return parseStackTrace(filteredStack)
}

func GetStack() ([]StackFrame, error) {
	return nil, nil
}

type StackFrame struct {
	FileName       string
	Line           int
	Column         int
	PackageName    string
	ParentFunction string
	FunctionName   string
}

func parseStackTrace(input []byte) ([]StackFrame, error) {
	var frames []StackFrame
	scanner := bufio.NewScanner(bytes.NewReader(input))

	funcRegex := regexp.MustCompile(`^([\w./-]+)\.([\w./-]+)(?:\.([\w./-]+))?\((.*)\)$`)

	fileRegex := regexp.MustCompile(`^\s*(.+):(\d+)(?::(\d+))?(?:\s+\+0x[0-9a-fA-F]+)?$`)

	var currentFrame StackFrame

	for scanner.Scan() {
		line := scanner.Text()

		if matches := funcRegex.FindStringSubmatch(line); matches != nil {
			if currentFrame.FileName != "" {
				frames = append(frames, currentFrame)
				currentFrame = StackFrame{}
			}

			currentFrame.PackageName = matches[1]
			currentFrame.FunctionName = matches[2]
			if matches[3] != "" {
				currentFrame.ParentFunction = matches[2]
				currentFrame.FunctionName = matches[3]
			}
		} else if matches := fileRegex.FindStringSubmatch(line); matches != nil {
			currentFrame.FileName = matches[1]
			line, _ := strconv.Atoi(matches[2])
			currentFrame.Line = line
			if matches[3] != "" {
				column, _ := strconv.Atoi(matches[3])
				currentFrame.Column = column
			}
		}
	}

	if currentFrame.FileName != "" {
		frames = append(frames, currentFrame)
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return frames, nil
}
