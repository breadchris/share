package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

type NolanState struct {
	Name       string
	Path       string
	Processing bool
	Data       string
}

type SomeSchema struct {
	// Description A short description of the content
	Description string `json:"description"`
}

func init() {
	if err := os.MkdirAll("data/nolan", os.ModePerm); err != nil {
		panic(err)
	}
}

func NewNolan(d deps.Deps) *http.ServeMux {
	mux := http.NewServeMux()
	nolan := d.Docs.WithCollection("nolan")

	mux.HandleFunc("/{id...}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		if id != "" {
			var ns NolanState
			if err := nolan.Get(id, &ns); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			t := ns.Data
			if ns.Processing {
				t = "Processing..."
			}
			DefaultLayout(
				Div(
					H1(T(ns.Name)),
					Div(T(t)),
				),
			).RenderPage(w, r)
			return
		}

		id = uuid.NewString()
		ctx := context.WithValue(r.Context(), "baseURL", "/nolanisslow")
		switch r.Method {
		case "GET":
			nl, err := nolan.List()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			var items []*Node
			for _, n := range nl {
				ns := n.Data.(NolanState)
				items = append(items, A(Attr("href", "/"+n.Id), T(ns.Name)))
			}

			DefaultLayout(
				Upload("/"),
			).RenderPageCtx(ctx, w, r)
			return
		case "POST":
			r.ParseMultipartForm(10 << 20)

			f, h, err := r.FormFile("file")
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer f.Close()

			//if !strings.HasPrefix(h.Header.Get("Content-Type"), "image/") {
			//	http.Error(w, "must be image", http.StatusBadRequest)
			//	return
			//}

			if h.Size > 10*1024*1024 {
				http.Error(w, "File is too large must be < 10mb", http.StatusBadRequest)
				return
			}

			ext := filepath.Ext(h.Filename)

			name := "data/uploads/" + id + ext
			o, err := os.Create(name)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			defer o.Close()

			if _, err = io.Copy(o, f); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			ss := &SomeSchema{}
			if err := ParsePDFWithSchema(d.Config.ExternalURL, d.AI, name, ss); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if err := nolan.Set(id, NolanState{
				Name:       h.Filename,
				Path:       name,
				Processing: true,
			}); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			b, err := json.Marshal(ss)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if err := nolan.Set(id, NolanState{
				Name:       h.Filename,
				Path:       name,
				Processing: false,
				Data:       string(b),
			}); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			return
		}
		w.Write([]byte("invalid method"))
	})
	return mux
}

func ParsePDFWithSchema(url string, client *openai.Client, pdfPath string, t any) error {
	images, err := ExtractPagesAsImages(pdfPath, "data/nolan")
	if err != nil {
		return fmt.Errorf("failed to extract text from PDF: %w", err)
	}

	schema, err := jsonschema.GenerateSchemaForType(t)
	if err != nil {
		return fmt.Errorf("failed to generate JSON schema: %w", err)
	}
	msgParts := []openai.ChatMessagePart{
		{
			Type: openai.ChatMessagePartTypeText,
			Text: fmt.Sprintf("Parse the following images and extract the relevant data"),
		},
	}

	for _, image := range images {
		msgParts = append(msgParts, openai.ChatMessagePart{
			Type: openai.ChatMessagePartTypeImageURL,
			ImageURL: &openai.ChatMessageImageURL{
				URL: url + "/" + image,
			},
		})
	}

	request := openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    "system",
				Content: "You are a data parser that extracts data from documents according to a schema.",
			},
			{
				Role:         "user",
				MultiContent: msgParts,
			},
		},
		ResponseFormat: &openai.ChatCompletionResponseFormat{
			Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
			JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
				Name:   "schema",
				Schema: schema,
				Strict: true,
			},
		},
	}

	res, err := client.CreateChatCompletion(context.Background(), request)
	if err != nil {
		return fmt.Errorf("failed to get response from OpenAI: %w", err)
	}

	for _, choice := range res.Choices {
		if choice.Message.Role == "assistant" {
			err := json.Unmarshal([]byte(choice.Message.Content), t)
			if err != nil {
				return fmt.Errorf("failed to unmarshal response from OpenAI: %w", err)
			}
		}
	}
	return nil
}

func ExtractPagesAsImages(pdfPath, outputDir string) ([]string, error) {
	err := os.MkdirAll(outputDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to create output directory: %v", err)
	}

	splitDir := filepath.Join(outputDir, "split_pages")
	err = os.MkdirAll(splitDir, os.ModePerm)
	if err != nil {
		return nil, fmt.Errorf("failed to create split directory: %v", err)
	}

	conf := model.NewDefaultConfiguration()
	conf.Cmd = model.SPLIT

	err = api.SplitFile(pdfPath, splitDir, 1, conf)
	if err != nil {
		return nil, fmt.Errorf("failed to split PDF: %v", err)
	}

	files, err := filepath.Glob(filepath.Join(splitDir, "*.pdf"))
	if err != nil {
		return nil, fmt.Errorf("failed to find split PDF files: %v", err)
	}

	var outputImages []string
	for _, file := range files {
		outputImage := filepath.Join(outputDir, fmt.Sprintf("%s.png", filepath.Base(file)))
		convertCmd := exec.Command("convert", file, outputImage)
		if err := convertCmd.Run(); err != nil {
			return nil, fmt.Errorf("failed to convert PDF page to image: %v", err)
		}
		fmt.Printf("Created image: %s\n", outputImage)
		outputImages = append(outputImages, outputImage)
	}

	err = os.RemoveAll(splitDir)
	if err != nil {
		return nil, fmt.Errorf("failed to cleanup split directory: %v", err)
	}
	return outputImages, nil
}
