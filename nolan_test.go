package main

import (
	"fmt"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/deps"
	"github.com/sashabaranov/go-openai"
	"testing"
)

type Test struct {
	Description string
}

func TestChatGPt(t *testing.T) {
	c := config.New()
	d := deps.Deps{
		AI: openai.NewClient(c.OpenAIKey),
	}

	test := Test{}
	err := ParsePDFWithSchema("/", d.AI, "data/nolan/test.pdf", &test)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Printf("%+v\n", t)
}
