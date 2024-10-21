package llm

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/config"
	"github.com/gorilla/websocket"
	"github.com/samber/lo"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	. "github.com/breadchris/share/html"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatState struct {
	ID       string
	Name     string
	Messages []ChatMessage `json:"messages"`
}

type InferRequest struct {
	Prompt string `json:"prompt"`
}

func SetupChatgpt(s *OpenAIService) *http.ServeMux {
	m := http.NewServeMux()

	m.HandleFunc("/", s.homeHandler)
	m.HandleFunc("/{id}", s.homeHandler)
	m.HandleFunc("/send", s.sendMessageHandler)
	m.HandleFunc("/chat", s.chatgptHandler)
	m.HandleFunc("/stream", s.streamHandler)
	return m
}

type OpenAIService struct {
	Client *openai.Client
}

func NewOpenAIService(cfg config.AppConfig) *OpenAIService {
	c := openai.NewClient(cfg.OpenAIKey)
	return &OpenAIService{
		Client: c,
	}
}

func (s *OpenAIService) homeHandler(w http.ResponseWriter, r *http.Request) {
	i := r.PathValue("id")
	var cs ChatState
	if i == "" {
		chats := loadChats()
		Ul(
			Ch(lo.Map(chats, func(c ChatState, i int) *Node {
				return Li(A(Href("/llm/"+c.ID), Class("block p-4 border-b"), T(c.Name)))
			})),
		).RenderPage(w, r)
		return
	}

	cs = loadChatState(i)
	Div(
		Ch(lo.Map(cs.Messages, func(m ChatMessage, i int) *Node {
			b := "mb-2"
			bs := "inline-block px-4 py-2 rounded "
			return Div(
				If(m.Role == "user", Class("text-right "+b), Class("text-left "+b)),
				Div(
					If(m.Role == "user", Class(bs+"bg-blue"), Class(bs+"bg-gray")),
					T(m.Content),
				),
			)
		})),
	).RenderPage(w, r)
}

func (s *OpenAIService) streamHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to websocket:", err)
		return
	}
	defer conn.Close()

	var req InferRequest
	if err := conn.ReadJSON(&req); err != nil {
		log.Println("Error reading request:", err)
		return
	}

	rq := openai.ChatCompletionRequest{
		Model: openai.GPT4o20240513,
		Messages: []openai.ChatCompletionMessage{
			{Role: "user", Content: req.Prompt},
		},
	}
	stream, err := s.Client.CreateChatCompletionStream(r.Context(), rq)
	if err != nil {
		log.Println("Error creating stream:", err)
		return
	}

	for {
		sr, err := stream.Recv()
		if err != nil {
			if err == io.EOF {
				break
			}
			log.Println("Error receiving response:", err)
			return
		}
		if err := conn.WriteMessage(websocket.TextMessage, []byte(sr.Choices[0].Delta.Content)); err != nil {
			log.Println("Error writing message:", err)
			return
		}
	}
}

func ChatGPTMsg(chatState ChatState) *Node {
	d := Div()
	for _, m := range chatState.Messages {
		b := "mb-2"
		bs := "inline-block px-4 py-2 rounded "
		d.Children = append(d.Children, Div(
			If(m.Role == "user", Class("text-right "+b), Class("text-left "+b)),
			Div(
				If(m.Role == "user", Class(bs+"bg-blue"), Class(bs+"bg-gray")),
				T(m.Content),
			),
		))
	}
	return d
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
	resp, err := s.Client.CreateChatCompletion(r.Context(), req)
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

	ChatGPTMsg(chatState).RenderPage(w, r)
}

func (s *OpenAIService) chatgptHandler(w http.ResponseWriter, r *http.Request) {
	chatID := filepath.Base(r.URL.Path)
	chatState := loadChatState(chatID)
	ChatGPTMsg(chatState).RenderPage(w, r)
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

func (s *OpenAIService) GenerateImage(ctx context.Context, prompt string) (string, error) {
	req := openai.ImageRequest{
		Model:          openai.CreateImageModelDallE3,
		Prompt:         prompt,
		N:              1,
		Quality:        openai.CreateImageQualityHD,
		Size:           openai.CreateImageSize1024x1792,
		Style:          openai.CreateImageStyleVivid,
		ResponseFormat: openai.CreateImageResponseFormatURL,
	}
	resp, err := s.Client.CreateImage(ctx, req)
	if err != nil {
		return "", err
	}
	imageURL := resp.Data[0].URL
	fmt.Println(imageURL)

	// Download the image
	imageResp, err := http.Get(imageURL)
	if err != nil {
		return "", err
	}
	defer imageResp.Body.Close()

	now := strconv.Itoa(time.Now().Nanosecond())
	imageName := fmt.Sprintf("generated_image%s.png", now)
	outputPath := fmt.Sprintf("./data/images/" + imageName)

	file, err := os.Create(outputPath)
	if err != nil {
		return "", err
	}
	defer file.Close()

	_, err = io.Copy(file, imageResp.Body)
	if err != nil {
		return "", err
	}

	return imageName, nil
}
