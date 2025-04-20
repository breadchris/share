package registry

import (
	"context"
	"fmt"
	"github.com/breadchris/share/deps"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"net/http"
)

func New(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	render := func(w http.ResponseWriter, r *http.Request, page *Node) {
		ctx := context.WithValue(r.Context(), "baseURL", "/registry")
		page.RenderPageCtx(ctx, w, r)
	}

	m.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			// Fetch top-level prompts (those not forked from another).
			var prompts []models.Prompt
			if err := d.DB.Where("parent_id IS NULL").Find(&prompts).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			render(w, r,
				DefaultLayout(
					Div(
						Class("container mx-auto p-8"),
						Div(Class("text-lg mb-4"), T("Welcome to the LLM Prompt Registry")),
						Div(
							Class("mb-4"),
							Ul(Ch(func() []*Node {
								var promptList []*Node
								for _, p := range prompts {
									item := Li(A(
										Href(fmt.Sprintf("/prompt/%s", p.ID)),
										T(fmt.Sprintf("Prompt #%s: %s", p.ID, p.Title)),
									))
									promptList = append(promptList, item)
								}
								return promptList
							}()),
							),
							Form(
								HxPost("/"),
								Input(Name("title"), Placeholder("Title"), Class("input input-bordered w-full mb-2")),
								TextArea(
									Name("prompt"),
									Placeholder("Enter your prompt here..."),
									Class("textarea textarea-bordered w-full mb-2"),
								),
								// Optional hidden field for forking (if provided, the new prompt is a fork)
								Input(Type("hidden"), Name("parent_id")),
								Button(
									Type("submit"),
									Class("btn btn-primary"),
									T("Submit New Prompt"),
								),
							),
						),
					),
				),
			)
		case http.MethodPost:
			// Create a new prompt submission and run it using the AI.
			title := r.FormValue("title")
			promptContent := r.FormValue("prompt")
			parentIDStr := r.FormValue("parent_id")
			// For this example, we assume the user ID is 1.
			newPrompt := models.Prompt{
				Model:    models.Model{ID: uuid.NewString()},
				Title:    title,
				Content:  promptContent,
				UserID:   "",
				ParentID: parentIDStr,
			}
			if err := d.DB.Create(&newPrompt).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			// Run the prompt via the AI service.
			res, err := d.AI.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
				Model: openai.GPT4oMini,
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    "system",
						Content: "You accept a user's prompt and generate a response.",
					},
					{
						Role:    "user",
						Content: promptContent,
					},
				},
			})
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			answer := res.Choices[0].Message.Content

			// Save the AI run output.
			promptRun := models.PromptRun{
				Model:    models.Model{ID: uuid.NewString()},
				PromptID: newPrompt.ID,
				Input:    promptContent,
				Output:   answer,
			}
			if err := d.DB.Create(&promptRun).Error; err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			// Render a confirmation page with the AI response.
			render(w, r,
				DefaultLayout(
					Div(
						Class("container mx-auto p-8"),
						Div(Class("mb-4"), T(fmt.Sprintf("Prompt created with ID %s", newPrompt.ID))),
						Div(Class("mb-4"), T("AI Response: "+answer)),
						A(Href(fmt.Sprintf("/prompt/%s", newPrompt.ID)), T("View Prompt Details")),
						Div(
							Class("mt-4"),
							A(Href("/"), T("Back to Home")),
						),
					),
				),
			)
		}
	})

	m.HandleFunc("/prompt/{id...}", func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		var prompt models.Prompt
		if err := d.DB.Preload("Runs").Preload("Forks").First(&prompt, "id = ?", idStr).Error; err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		var runList []*Node
		for _, run := range prompt.Runs {
			runItem := Div(
				Class("border p-2 mb-2"),
				Div(T(fmt.Sprintf("Run ID: %s", run.ID))),
				Div(T("Input: "+run.Input)),
				Div(T("Output: "+run.Output)),
			)
			runList = append(runList, runItem)
		}

		// Build the forks list.
		var forkList []*Node
		for _, fork := range prompt.Forks {
			forkItem := A(
				Href(fmt.Sprintf("/prompt/%s", fork.ID)),
				T(fmt.Sprintf("Fork ID: %s - %s", fork.ID, fork.Title)),
			)
			forkList = append(forkList, forkItem)
		}

		render(w, r,
			DefaultLayout(
				Div(
					Class("container mx-auto p-8"),
					Div(Class("text-xl mb-4"), T(fmt.Sprintf("Prompt #%s Details", prompt.ID))),
					Div(Class("mb-4"), T("Title: "+prompt.Title)),
					Div(Class("mb-4"), T("Content: "+prompt.Content)),
					Div(
						Class("mb-4"),
						Div(T("Run History:")),
						Div(runList...),
					),
					Div(
						Class("mb-4"),
						Div(T("Forks:")),
						Div(forkList...),
					),
					// Fork form: allows a user to fork this prompt.
					Div(
						Class("border p-4"),
						Div(Class("mb-2"), T("Fork this prompt")),
						Form(
							HxPost("/"),
							// Set parent_id so that the new prompt is linked as a fork.
							Input(Type("hidden"), Name("parent_id"), Value(fmt.Sprintf("%s", prompt.ID))),
							Input(Name("title"), Placeholder("New Title"), Class("input input-bordered w-full mb-2")),
							TextArea(
								Name("prompt"),
								Placeholder("Edit prompt content..."),
								Class("textarea textarea-bordered w-full mb-2"),
								Value(prompt.Content),
							),
							Button(
								Type("submit"),
								Class("btn btn-secondary"),
								T("Fork & Run"),
							),
						),
					),
					A(Href("/"), T("Back to Home")),
				),
			),
		)
	})

	// Endpoint to re-run an existing prompt.
	m.HandleFunc("/prompt/run", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		idStr := r.FormValue("prompt_id")
		var prompt models.Prompt
		if err := d.DB.First(&prompt, idStr).Error; err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		// Re-run the prompt using the AI service.
		res, err := d.AI.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
			Model: openai.GPT4oMini,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    "system",
					Content: "You accept a user's prompt and generate a response.",
				},
				{
					Role:    "user",
					Content: prompt.Content,
				},
			},
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		answer := res.Choices[0].Message.Content

		// Save the new run.
		promptRun := models.PromptRun{
			Model:    models.Model{ID: uuid.NewString()},
			PromptID: prompt.ID,
			Input:    prompt.Content,
			Output:   answer,
		}
		if err := d.DB.Create(&promptRun).Error; err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Redirect back to the prompt details page.
		http.Redirect(w, r, fmt.Sprintf("/prompt/%s", prompt.ID), http.StatusSeeOther)
	})

	return m
}
