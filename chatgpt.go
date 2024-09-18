package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	. "github.com/breadchris/share/html2"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatState struct {
	ID       string
	Name     string
	Messages []ChatMessage `json:"messages"`
}

var (
	tm    *template.Template
	tmmsg *template.Template
)

func setupChatgpt(s *OpenAIService) *http.ServeMux {
	m := http.NewServeMux()
	tm = template.Must(template.ParseFiles("chatgpt.html"))
	tmmsg = template.Must(template.ParseFiles("chatgptmsg.html"))

	m.HandleFunc("/", s.homeHandler)
	m.HandleFunc("/{id}", s.homeHandler)
	m.HandleFunc("/send", s.sendMessageHandler)
	m.HandleFunc("/chat", s.chatgptHandler)
	m.HandleFunc("/generate-image", s.GenerateImage)
	return m
}

type OpenAIService struct {
	client *openai.Client
}

func NewOpenAIService(config AppConfig) *OpenAIService {
	c := openai.NewClient(config.OpenAIKey)
	return &OpenAIService{
		client: c,
	}
}

func (s *OpenAIService) homeHandler(w http.ResponseWriter, r *http.Request) {
	i := r.PathValue("id")
	var chatState ChatState
	if i != "" {
		chatState = loadChatState(i)
	}
	chats := loadChats()
	err := tm.Execute(w, struct {
		Chats    []ChatState
		Messages []ChatMessage
	}{Chats: chats, Messages: chatState.Messages})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *OpenAIService) sendMessageHandler(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	message := r.FormValue("message")
	chatID := r.URL.Query().Get("chat")

	if chatID == "" {
		chatID = uuid.NewString()
		err := saveChat(ChatState{ID: chatID, Name: fmt.Sprintf("Chat %s", chatID)})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	chatState := loadChatState(chatID)
	chatState.Messages = append(chatState.Messages, ChatMessage{Role: "user", Content: message})

	// Call OpenAI API
	req := openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: "system", Content: "You are a helpful assistant."},
			{Role: "user", Content: message},
		},
	}
	resp, err := s.client.CreateChatCompletion(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	chatState.Messages = append(
		chatState.Messages,
		ChatMessage{
			Role: "assistant", Content: resp.Choices[0].Message.Content,
		},
	)
	saveChatState(chatID, chatState)

	err = tmmsg.Execute(w, chatState)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *OpenAIService) chatgptHandler(w http.ResponseWriter, r *http.Request) {
	chatID := filepath.Base(r.URL.Path)
	chatState := loadChatState(chatID)
	err := tmmsg.ExecuteTemplate(w, "chat-messages", chatState)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func loadChats() []ChatState {
	files, _ := os.ReadDir("data/chatgpt")
	var chats []ChatState
	for _, f := range files {
		if filepath.Ext(f.Name()) == ".json" {
			data, _ := os.ReadFile("data/chatgpt/" + f.Name())
			var chat ChatState
			err := json.Unmarshal(data, &chat)
			if err != nil {
				fmt.Println(err)
				continue
			}
			chats = append(chats, chat)
		}
	}
	return chats
}

func saveChat(chat ChatState) error {
	data, _ := json.Marshal(chat)
	// create the directory if it doesn't exist
	if err := os.MkdirAll("data/chatgpt", 0755); err != nil {
		return err
	}
	return os.WriteFile(fmt.Sprintf("data/chatgpt/%s.json", chat.ID), data, 0644)
}

func loadChatState(chatID string) ChatState {
	data, err := os.ReadFile(fmt.Sprintf("data/chatgpt/%s.json", chatID))
	if err != nil {
		return ChatState{}
	}
	var state ChatState
	json.Unmarshal(data, &state)
	return state
}

func saveChatState(chatID string, state ChatState) {
	data, _ := json.Marshal(state)
	os.WriteFile(fmt.Sprintf("data/chatgpt/%s.json", chatID), data, 0644)
}

func (s *OpenAIService) GenerateImage(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Generating image")
	r.ParseForm()
	prompt := r.FormValue("content")
	fmt.Println("Prompt: ", prompt)
	req := openai.ImageRequest{
		Model:          openai.CreateImageModelDallE3,
		Prompt:         prompt,
		N:              1,
		Quality:        openai.CreateImageQualityHD,
		Size:           openai.CreateImageSize1024x1792,
		Style:          openai.CreateImageStyleVivid,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}
	resp, err := s.client.CreateImage(r.Context(), req)
	if err != nil {
		http.Error(w, "Error generating image", http.StatusInternalServerError)
		return
	}
	imageURL := resp.Data[0].URL
	fmt.Println(imageURL)

	// Download the image
	imageResp, err := http.Get(imageURL)
	if err != nil {
		http.Error(w, "Error downloading image", http.StatusInternalServerError)
	}
	defer imageResp.Body.Close()

	now := strconv.Itoa(time.Now().Nanosecond())
	imageName := fmt.Sprintf("generated_image%s.png", now)
	// Define the output path for the generated image
	outputPath := fmt.Sprintf("./data/images/" + imageName)

	// Create the output file
	file, err := os.Create(outputPath)
	if err != nil {
		http.Error(w, "Error creating file", http.StatusInternalServerError)
	}
	defer file.Close()

	// Write the image to the file
	_, err = io.Copy(file, imageResp.Body)
	if err != nil {
		http.Error(w, "Error writing image", http.StatusInternalServerError)
	}
	image := Img(Attr("style", "max-width: 100%; object-fit: contain;"), Attr("src", "/data/images/"+imageName), Attr("alt", "Uploaded Image"))

	w.Write([]byte(image.Render()))
}
