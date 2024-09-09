package zine

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"

	"github.com/breadchris/share/chatgpt"
	. "github.com/breadchris/share/html"
	"github.com/breadchris/share/types"
)

func (z *ZineMaker) GenerateImage(w http.ResponseWriter, r *http.Request) {
	imageName := chatgpt.NewOpenAIService(types.LoadConfig()).GenerateImage(w, r)
	panelId := r.Header.Get("Hx-Target")
	panelData := PanelData{
		PanelID:   panelId,
		Content:   "",
		ImagePath: "/data/images/" + imageName,
	}

	image := createPanel(panelData, panelId)

	err := z.savePanelData(z.zineID, panelData)
	if err != nil {
		http.Error(w, "Error saving panel data", http.StatusInternalServerError)
		return
	}
	// image := Img(Attr("style", "max-width: 100%; object-fit: contain;"), Attr("src", "/data/images/"+imageName), Attr("alt", "Uploaded Image"))

	w.Write([]byte(image.Render()))
}

func (z *ZineMaker) GenerateZineImage(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	zineId := r.Form.Get("div_id")

	// Get the HTML content from the request
	content := r.FormValue(zineId)
	screenshotPath := ""
	// Generate the image
	err, screenshotPath = captureDivScreenshotFromHTML(content, zineId)
	if err != nil {
		http.Error(w, "Error generating the image", http.StatusInternalServerError)
		return
	}
	screenshotPath = "/" + screenshotPath
	fmt.Printf("Generated image: %s\n", screenshotPath)

	image := Div(Id("zine-image"), Class("mt-4"),
		Img(Attr("src", screenshotPath), Attr("alt", "Generated Zine")),
	).Render()

	w.Write([]byte(image))
}

// PanelData represents the content and image for a single panel
type PanelData struct {
	PanelID   string `json:"panel_num"`
	Content   string `json:"content"`
	ImagePath string `json:"image_path,omitempty"`
}

// CreatePanelHandler handles the creation of a new panel
func (z *ZineMaker) CreatePanelHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	zineId := z.zineID

	// Parse form data
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Error parsing form data", http.StatusBadRequest)
		return
	}

	// Handle text content
	content := r.FormValue("content")

	panelId := r.Header.Get("Hx-Target")

	err, filePath := fileUploadHandler(w, r)
	if err != nil {
		return
	}

	// Save the panel data to JSON
	panelData := PanelData{
		PanelID:   panelId,
		Content:   content,
		ImagePath: filePath,
	}

	err = z.savePanelData(zineId, panelData)
	if err != nil {
		http.Error(w, "Error saving panel data", http.StatusInternalServerError)
		return
	}

	var htmlContent string = createPanel(panelData, panelId).Render()

	w.Write([]byte(htmlContent))
}

func createPanel(panelData PanelData, panelId string) *Node {
	unsideDownPanels := []string{"panel_1", "panel_6", "panel_7", "panel_8"}
	if panelData.PanelID == "" {
		return Div(Id(panelId), ZinePanel(), T(panelId))
	}
	var image *Node
	if panelData.ImagePath != "" {
		image = Div(Img(Image(), Attr("src", "/data/images/"+filepath.Base(panelData.ImagePath)), Attr("alt", "Uploaded Image")))
	}

	content := Div(P(T(panelData.Content)))

	var panel *Node
	if image != nil {
		panel = Div(image, content)
	} else {
		panel = Div(content)
	}

	var outerDiv *Node
	if slices.Contains(unsideDownPanels, panelData.PanelID) {
		outerDiv = Div(Id(panelData.PanelID), ZinePanelUpsideDown())
	} else {
		outerDiv = Div(Id(panelData.PanelID), ZinePanel())
	}
	outerDiv.Children = append(outerDiv.Children, panel)

	return outerDiv
}

// savePanelData saves the panel data to a JSON file
func (z *ZineMaker) savePanelData(zineId string, panelData PanelData) error {
	panelPath := fmt.Sprintf("./data/zines/Z-%s.json", zineId)
	if _, err := os.Stat("./data/zines"); os.IsNotExist(err) {
		err := os.MkdirAll("./data/zines", os.ModePerm)
		if err != nil {
			return err
		}
	}

	// Load existing data if the file exists
	var panels = make(map[string]PanelData)
	if _, err := os.Stat(panelPath); err == nil {
		file, err := os.ReadFile(panelPath)
		if err != nil {
			return err
		}
		err = json.Unmarshal(file, &panels)
		if err != nil {
			return err
		}
	}

	panels[panelData.PanelID] = panelData

	// Save the updated panel data back to the file
	data, err := json.MarshalIndent(panels, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(panelPath, data, 0644)
}

func fileUploadHandler(w http.ResponseWriter, r *http.Request) (error, string) {
	// Handle file upload
	file, handler, err := r.FormFile("uploadfile")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving the file", http.StatusInternalServerError)
		return err, ""
	}
	if err != http.ErrMissingFile {
		defer file.Close()
	}

	var filePath string
	if handler != nil {
		// Save the uploaded file
		filePath = "./data/images/" + handler.Filename
		out, err := os.Create(filePath)
		if err != nil {
			http.Error(w, "Error saving the file", http.StatusInternalServerError)
			return err, ""
		}
		defer out.Close()

		_, err = io.Copy(out, file)
		if err != nil {
			http.Error(w, "Error writing the file", http.StatusInternalServerError)
			return err, ""
		}
	}

	return nil, filePath
}
