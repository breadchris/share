---
title: go struct to ai stuff
tags:
    - go
created_at: "2024-10-15T22:41:07-07:00"
blocknote: '[{"id":"7158fec9-61d4-48b6-964e-7ff8aed93721","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Being able to develop go in an interpreter feels magical. I feel like I can fly through errors or web design iterations. The particular feature I was working on today was something I have been wanting to do for a while, and kind of did with protobufs, but it didn''t feel as good as this version.\n","styles":{}}],"children":[]},{"id":"a38912bf-8993-4572-9577-a9b109fa311c","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Going from a go struct -> json schema -> chatgpt prompt -> go struct instance is pretty sick. On top of this, I have the struct -> html form builder which makes this whole thing feel super neat. ","styles":{}}],"children":[]},{"id":"b3685bf8-e14c-42ea-bac6-c462b8af2c37","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"912f42a0-7f41-458e-a786-0cbb4e1a2a2b","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Outside of some missing functions ","styles":{}},{"type":"text","text":"BuildForm2","styles":{"code":true}},{"type":"text","text":" this is pretty much all the code that was needed to pull this off. ","styles":{}}],"children":[]},{"id":"65a11f67-7dad-4f66-829b-bf77ca6c52e9","type":"procode","props":{"data":"\tr.HandleFunc(\"/new/ai\", func(w http.ResponseWriter, r *http.Request) {\n\t\tif r.Method == http.MethodPost {\n\t\t\tvar recipe Recipe\n\t\t\tschema, err := jsonschema.GenerateSchemaForType(recipe)\n\t\t\tif err != nil {\n\t\t\t\thttp.Error(w, err.Error(), http.StatusInternalServerError)\n\t\t\t\treturn\n\t\t\t}\n\t\t\treq := openai.ChatCompletionRequest{\n\t\t\t\tModel: openai.GPT4oMini,\n\t\t\t\tMessages: []openai.ChatCompletionMessage{\n\t\t\t\t\t{Role: \"system\", Content: \"You are a professional chef. You provide great recipes.\"},\n\t\t\t\t\t{Role: \"user\", Content: \"Create a new recipe for \" + r.FormValue(\"description\")},\n\t\t\t\t},\n\t\t\t\tResponseFormat: &openai.ChatCompletionResponseFormat{\n\t\t\t\t\tType: openai.ChatCompletionResponseFormatTypeJSONSchema,\n\t\t\t\t\tJSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{\n\t\t\t\t\t\tName:   \"create_recipe\",\n\t\t\t\t\t\tSchema: schema,\n\t\t\t\t\t\tStrict: true,\n\t\t\t\t\t},\n\t\t\t\t},\n\t\t\t}\n\t\t\tres, err := d.AI.Client.CreateChatCompletion(context.Background(), req)\n\t\t\tif err != nil {\n\t\t\t\thttp.Error(w, err.Error(), http.StatusInternalServerError)\n\t\t\t\treturn\n\t\t\t}\n\n\t\t\tfor _, choice := range res.Choices {\n\t\t\t\tif choice.Message.Role == \"assistant\" {\n\t\t\t\t\terr := json.Unmarshal([]byte(choice.Message.Content), &recipe)\n\t\t\t\t\tif err != nil {\n\t\t\t\t\t\thttp.Error(w, err.Error(), http.StatusInternalServerError)\n\t\t\t\t\t\treturn\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\n\t\t\tBuildForm2(\"\", recipe, \"\").RenderPage(w, r)\n\t\t\treturn\n\t\t}\n\t\tDefaultLayout(\n\t\t\tDiv(\n\t\t\t\tReloadNode(\"vote.go\"),\n\t\t\t\tClass(\"container mx-auto mt-10 p-5\"),\n\t\t\t\tForm(\n\t\t\t\t\tHxPost(\"/vote/new/ai\"),\n\t\t\t\t\tHxTarget(\"#result\"),\n\t\t\t\t\tInput(Type(\"text\"), Name(\"description\"), Class(\"input\"), Placeholder(\"Description\")),\n\t\t\t\t\tButton(Class(\"btn btn-neutral\"), Type(\"submit\"), T(\"Generate Recipe\")),\n\t\t\t\t),\n\t\t\t\tDiv(Id(\"result\")),\n\t\t\t),\n\t\t).RenderPage(w, r)\n\t\treturn\n\t})"},"children":[]},{"id":"d662f0f3-10b2-49d3-b3bb-adc96999d1ca","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"c5b37703-8a64-4dc8-b373-36f1ba208907","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]},{"id":"initialBlockId","type":"image","props":{"backgroundColor":"default","textAlignment":"left","name":"Screenshot 2024-10-15 at 10.36.57 PM.png","url":"/data/uploads/5ceb518e-994e-43f0-906b-982376a54142.png","caption":"","showPreview":true,"previewWidth":512},"children":[]},{"id":"d571546a-8264-4b10-93cc-52e88560484a","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Something I have been thinking about too has been what the feeling of this type of development is starting to unlock. I would like to polish the code builder and put that up for people to use.","styles":{}}],"children":[]},{"id":"c8fd39ac-71d0-4ac8-bd5e-a445215b5023","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[],"children":[]}]'

---
Being able to develop go in an interpreter feels magical. I feel like I can fly through errors or web design iterations. The particular feature I was working on today was something I have been wanting to do for a while, and kind of did with protobufs, but it didn't feel as good as this version.

Going from a go struct -> json schema -> chatgpt prompt -> go struct instance is pretty sick. On top of this, I have the struct -> html form builder which makes this whole thing feel super neat.

Outside of some missing functions `BuildForm2` this is pretty much all the code that was needed to pull this off.

    	r.HandleFunc("/new/ai", func(w http.ResponseWriter, r *http.Request) {
    		if r.Method == http.MethodPost {
    			var recipe Recipe
    			schema, err := jsonschema.GenerateSchemaForType(recipe)
    			if err != nil {
    				http.Error(w, err.Error(), http.StatusInternalServerError)
    				return
    			}
    			req := openai.ChatCompletionRequest{
    				Model: openai.GPT4oMini,
    				Messages: []openai.ChatCompletionMessage{
    					{Role: "system", Content: "You are a professional chef. You provide great recipes."},
    					{Role: "user", Content: "Create a new recipe for " + r.FormValue("description")},
    				},
    				ResponseFormat: &openai.ChatCompletionResponseFormat{
    					Type: openai.ChatCompletionResponseFormatTypeJSONSchema,
    					JSONSchema: &openai.ChatCompletionResponseFormatJSONSchema{
    						Name:   "create_recipe",
    						Schema: schema,
    						Strict: true,
    					},
    				},
    			}
    			res, err := d.AI.Client.CreateChatCompletion(context.Background(), req)
    			if err != nil {
    				http.Error(w, err.Error(), http.StatusInternalServerError)
    				return
    			}

    			for _, choice := range res.Choices {
    				if choice.Message.Role == "assistant" {
    					err := json.Unmarshal([]byte(choice.Message.Content), &recipe)
    					if err != nil {
    						http.Error(w, err.Error(), http.StatusInternalServerError)
    						return
    					}
    				}
    			}

    			BuildForm2("", recipe, "").RenderPage(w, r)
    			return
    		}
    		DefaultLayout(
    			Div(
    				ReloadNode("vote.go"),
    				Class("container mx-auto mt-10 p-5"),
    				Form(
    					HxPost("/vote/new/ai"),
    					HxTarget("#result"),
    					Input(Type("text"), Name("description"), Class("input"), Placeholder("Description")),
    					Button(Class("btn btn-neutral"), Type("submit"), T("Generate Recipe")),
    				),
    				Div(Id("result")),
    			),
    		).RenderPage(w, r)
    		return
    	})

![Screenshot 2024-10-15 at 10.36.57 PM.png](/data/uploads/5ceb518e-994e-43f0-906b-982376a54142.png)

Something I have been thinking about too has been what the feeling of this type of development is starting to unlock. I would like to polish the code builder and put that up for people to use.
