package main

import (
	"encoding/json"
	. "github.com/breadchris/share/html2"
)

type PromptState struct {
	Prompt string `json:"string"`
}

func RenderPrompt(s []byte) (string, error) {
	var state PromptState
	err := json.Unmarshal(s, &state)
	if err != nil {
		return "", err
	}

	return Html(
		Head(
			Title(T("Collaborative Chat Platform")),
			Link(Attrs(map[string]string{
				"rel":  "stylesheet",
				"type": "text/css",
				"href": "https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css",
			})),
			Script(Src("https://cdn.tailwindcss.com")),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(
			Class("min-h-screen flex flex-col"),
			Header(
				Class("bg-blue-600 text-white p-4"),
				Div(
					Class("container mx-auto"),
					H1(T("Collaborative Chat Platform")),
					Nav(
						Ul(
							Class("flex space-x-4"),
							Li(A(Href("/"), T("Home"))),
							Li(A(Href("/chat"), T("Chat"))),
							Li(A(Href("/prompts"), T("Prompts"))),
						),
					),
				),
			),
			Main(
				Class("flex-1 container mx-auto p-4 flex"),
				// Left Sidebar: Active Users
				Div(
					Class("w-1/4 p-4 bg-gray-100"),
					H2(Class("text-xl font-bold mb-4"), T("Active Users")),
					Ul(
						Li(T("User 1")),
						Li(T("User 2")),
						Li(T("User 3")),
						Li(T("User 4")),
					),
				),
				// Central Chat Area
				Div(
					Class("flex-1 p-4 bg-white border border-gray-300"),
					H2(Class("text-xl font-bold mb-4"), T("Group Chat")),
					Div(
						Class("chat-messages h-80 overflow-y-scroll mb-4"),
						Div(
							Class("message p-2 bg-gray-100 rounded mb-2"),
							Span(Class("font-bold"), T("User 1: ")),
							Span(T("Hey, how's everyone doing?")),
						),
						Div(
							Class("message p-2 bg-gray-100 rounded mb-2"),
							Span(Class("font-bold"), T("User 2: ")),
							Span(T("I'm good! What's the plan for today?")),
						),
						// More chat messages go here...
					),
					Div(
						Class("chat-input flex"),
						Input(
							Class("border rounded w-full py-2 px-3"),
							Type("text"),
							Placeholder("Type your message..."),
						),
						Button(
							Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 ml-2 rounded"),
							T("Send"),
						),
					),
				),
				// Right Sidebar: Prompts and Reactions
				Div(
					Class("w-1/4 p-4 bg-gray-100"),
					H2(Class("text-xl font-bold mb-4"), T("Current Prompt")),
					P(T("Describe a collaborative feature you'd like to see.")),
					Form(
						Method("POST"),
						Action("/submit-prompt"),
						TextArea(
							Class("border rounded w-full py-2 px-3 mb-4"),
							Id("prompt"),
							Name("prompt"),
							Rows(3),
							Placeholder("Submit your prompt..."),
						),
						Button(
							Class("bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"),
							T("Submit Prompt"),
						),
					),
					Div(
						Class("mt-4"),
						H3(Class("text-lg font-bold"), T("Reactions")),
						Div(
							Class("flex space-x-2"),
							Button(
								Class("bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"),
								T("❤️"),
							),
							Button(
								Class("bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"),
								T("👍"),
							),
							Button(
								Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
								T("😂"),
							),
						),
					),
				),
			),
		),
	).Render(), nil
}

func RenderPricingHTML(_ []byte) (string, error) {
	return Div(Class("bg-white py-24 sm:py-32"),
		Script(Src("https://cdn.tailwindcss.com")),
		Div(Class("mx-auto max-w-7xl px-6 lg:px-8"),
			Div(Class("mx-auto max-w-2xl sm:text-center"),
				H2(Class("text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"), T("Simple no-tricks pricing")),
				P(Class("mt-6 text-lg leading-8 text-gray-600"),
					T("Distinctio et nulla eum soluta et neque labore quibusdam. Saepe et quasi iusto modi velit ut non voluptas in. Explicabo id ut laborum."),
				),
			),
			Div(Class("mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none"),
				Div(Class("p-8 sm:p-10 lg:flex-auto"),
					H3(Class("text-2xl font-bold tracking-tight text-gray-900"), T("Lifetime membership")),
					P(Class("mt-6 text-base leading-7 text-gray-600"),
						T("Lorem ipsum dolor sit amet consect etur adipisicing elit. Itaque amet indis perferendis blanditiis repellendus etur quidem assumenda."),
					),
					Div(Class("mt-10 flex items-center gap-x-4"),
						H4(Class("flex-none text-sm font-semibold leading-6 text-indigo-600"), T("What’s included")),
						Div(Class("h-px flex-auto bg-gray-100")),
					),
					Ul(Attr("role", "list"), Class("mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attrs(map[string]string{"viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true"}),
								Path(Attrs(map[string]string{"fill-rule": "evenodd", "d": "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", "clip-rule": "evenodd"})),
							),
							T("Private forum access"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attrs(map[string]string{"viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true"}),
								Path(Attrs(map[string]string{"fill-rule": "evenodd", "d": "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", "clip-rule": "evenodd"})),
							),
							T("Member resources"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attrs(map[string]string{"viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true"}),
								Path(Attrs(map[string]string{"fill-rule": "evenodd", "d": "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", "clip-rule": "evenodd"})),
							),
							T("Entry to annual conference"),
						),
						Li(Class("flex gap-x-3"),
							Svg(Class("h-6 w-5 flex-none text-indigo-600"), Attrs(map[string]string{"viewBox": "0 0 20 20", "fill": "currentColor", "aria-hidden": "true"}),
								Path(Attrs(map[string]string{"fill-rule": "evenodd", "d": "M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z", "clip-rule": "evenodd"})),
							),
							T("Official member t-shirt"),
						),
					),
				),
				Div(Class("-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0"),
					Div(Class("rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16"),
						Div(Class("mx-auto max-w-xs px-8"),
							P(Class("text-base font-semibold text-gray-600"), T("Pay once, own it forever")),
							P(Class("mt-6 flex items-baseline justify-center gap-x-2"),
								Span(Class("text-5xl font-bold tracking-tight text-gray-900"), T("$349")),
								Span(Class("text-sm font-semibold leading-6 tracking-wide text-gray-600"), T("USD")),
							),
							A(Href("#"), Class("mt-10 block w-full rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"),
								T("Get access"),
							),
							P(Class("mt-6 text-xs leading-5 text-gray-600"),
								T("Invoices and receipts available for easy company reimbursement"),
							),
						),
					),
				),
			),
		),
	).Render(), nil
}
