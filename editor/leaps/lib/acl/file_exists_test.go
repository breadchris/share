package acl

import (
	"os"
	"testing"

	"github.com/breadchris/share/editor/leaps/lib/util/service/log"
)

//--------------------------------------------------------------------------------------------------

func logger() log.Modular {
	logConf := log.NewLoggerConfig()
	logConf.LogLevel = "OFF"
	return log.NewLogger(os.Stdout, logConf)
}

func TestIgnorePatterns(t *testing.T) {
	f := FileExists{logger: logger()}

	testStories := []struct {
		Patterns []string
		Path     string
		Expected bool
	}{
		{
			Patterns: []string{"*.jpg"},
			Path:     "test.jpg",
			Expected: true,
		},
		{
			Patterns: []string{"*.jpg"},
			Path:     "./test.jpg",
			Expected: true,
		},
		{
			Patterns: []string{"./*.jpg"},
			Path:     "foo/test.jpg",
			Expected: false,
		},
		{
			Patterns: []string{"./*.jpg"},
			Path:     "test.jpg",
			Expected: true,
		},
		{
			Patterns: []string{"*.jpg"},
			Path:     "foo/test.jpg",
			Expected: true,
		},
		{
			Patterns: []string{"foo/*.jpg"},
			Path:     "foo/test.jpg",
			Expected: true,
		},
		{
			Patterns: []string{"foo/*.jpg"},
			Path:     "test.jpg",
			Expected: false,
		},
		{
			Patterns: []string{"foo/**/*.jpg"},
			Path:     "test.jpg",
			Expected: false,
		},
	}

	for _, story := range testStories {
		exp, act := story.Expected, f.checkPatterns(story.Patterns, story.Path)
		if exp != act {
			t.Errorf("Wrong result: %v != %v\n", exp, act)
			t.Errorf("Patterns: %s\n", story.Patterns)
			t.Errorf("Path:     %s\n", story.Path)
		}
	}
}

//--------------------------------------------------------------------------------------------------
