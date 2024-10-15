package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"

	. "github.com/breadchris/share/html"
	"github.com/chromedp/chromedp"
	"github.com/google/uuid"
)

type ZineMaker struct {
	zineID string
}

func (z *ZineMaker) SetupZineRoutes() {
	http.HandleFunc("/zine", func(w http.ResponseWriter, r *http.Request) {
		// Generate a new UUID for the zine session
		sessionID := uuid.New().String()

		// Redirect the user to the new URL with the UUID
		http.Redirect(w, r, "/zine-maker/"+sessionID, http.StatusSeeOther)
	})

	http.HandleFunc("/zine-maker/", func(w http.ResponseWriter, r *http.Request) {
		// Extract the session ID from the URL
		sessionID := strings.TrimPrefix(r.URL.Path, "/zine-maker/")

		z.zineID = sessionID

		// You can validate the UUID if necessary
		_, err := uuid.Parse(sessionID)
		if err != nil {
			http.Error(w, "Invalid session ID", http.StatusBadRequest)
			return
		}
		sessionID = "Z-" + sessionID

		w.Write([]byte(ZineIndex(sessionID).Render()))
	})

	http.HandleFunc("/zine/generate-zine-image", z.GenerateZineImage)
	http.HandleFunc("/zine/create-panel", z.CreatePanelHandler)
	http.HandleFunc("/generate-image", z.GenerateImage)
}

func NewZineMaker() *ZineMaker {
	if _, err := os.Stat("./data/images"); os.IsNotExist(err) {
		os.Mkdir("./data/images", 0755)
	}
	return &ZineMaker{}
}

func ZineIndex(sessionID string) *Node {
	return Html(
		Head(
			Title(T("Zine Maker!")),
			Script(Src("https://unpkg.com/htmx.org@2.0.0/dist/htmx.min.js")),
			Script(Src("https://unpkg.com/htmx.org@1.9.12/dist/ext/ws.js")),
			Script(Src("https://cdn.tailwindcss.com")),
			Link(Href("https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css"), Attr("rel", "stylesheet"), Attr("type", "text/css")),
			BodyStyle(),
			Style(T("body { font-family: 'Inter', sans-serif; }")),
		),
		Body(Class("min-h-screen flex flex-col"),
			Div(Class("container mx-auto text-center mt-16"),
				H1(Class("text-4xl font-bold mb-4"), T("Zine Creator")),
				PanelNav(sessionID),
				PanelForm(),
				Zine(sessionID),
				CreateZineButton(sessionID),
			),
		),
	)
}

func CreateZineButton(sessionID string) *Node {
	_, version, _ := currentVersion(sessionID)
	zineDir := fmt.Sprintf("./data/images/%s", sessionID)
	screenshotName := fmt.Sprintf("zine-%d.png", version)
	screenshotPath := "/" + filepath.Join(zineDir, screenshotName)

	return Div(Class("mt-8"),
		Button(Class("bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"),
			Attr("hx-post", "/zine/generate-zine-image"),
			Attr("hx-include", fmt.Sprintf("#%s", sessionID)),
			Attr("hx-target", "#zine-image"),
			T("Generate Zine Image"),
		),
		Div(Id("zine-image"), Class("mt-4"),
			Img(Attr("src", screenshotPath), Attr("alt", "Generated Zine")),
		),
	)
}

func PanelForm() *Node {
	return Div(Id("panel_form_div"), Class("pt-4"),
		Form(Id("panel_form"), Attr("hx-post", "/zine/create-panel"), Attr("hx-target", "#panel_1"),
			Attr("hx-swap", "outerHTML"), Attr("enctype", "multipart/form-data"), Attr("hx-on::after-request", "this.reset()"),
			Div(Class("flex justify-center space-x-4"),
				TextArea(Name("content"), Placeholder("Write your text here")),
				Div(Id("AddImage"), Input(Type("file"), Name("uploadfile"))),
				Div(
					Button(Class("bg-blue-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l"), Type("submit"),
						T("Create Panel")),
					Button(Id("ImageGenButton"), Class("bg-green-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r"), Type("button"),
						Attr("hx-post", "/generate-image"), Attr("hx-target", "#panel_1"),
						Attr("hx-swap", "innerHTML"), T("Generate Image")),
				),
			),
		),
	)
}

func PanelNav(sessionID string) *Node {
	return Div(Class("flex justify-center space-x-4"),
		Button(Id("1"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "1"), T("Page 1")),
		Button(Id("2"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "2"), T("Page 2")),
		Button(Id("3"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "3"), T("Page 3")),
		Button(Id("4"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "4"), T("Page 4")),
		Button(Id("5"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "5"), T("Page 5")),
		Button(Id("6"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "6"), T("Page 6")),
		Button(Id("7"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "7"), T("Page 7")),
		Button(Id("8"), Class("panelselctionbutton bg-emerald-500 hover:bg-emerald-700 active:bg-emerald-900 text-gray-800 font-bold py-2 px-4 rounded"), Attr("value", "8"), T("Page 8")),
		Script(T(fmt.Sprintf(`
						buttons = document.getElementsByClassName("panelselctionbutton")
						for (var i = 0; i < buttons.length; i++) {
							buttons[i].addEventListener("click", function() {
								var dynamicElement = document.getElementById("panel_form");
								var dynamicButton = document.getElementById("ImageGenButton");

								dynamicElement.setAttribute("hx-target", "#panel_" + this.value);
								dynamicButton.setAttribute("hx-target", "#panel_" + this.value);
								

								// Remove the "active" class from all buttons
								for (var j = 0; j < buttons.length; j++) {
									buttons[j].style.backgroundColor="rgb(16 185 129)";
								}

								// Add the "active" class to the clicked button
								this.style.backgroundColor="rgb(6 78 59)";
							});
						}
						document.addEventListener('htmx:configRequest', (event) => {
						const newZineElement = document.querySelector("#%s");
						if (newZineElement) {
							const htmlContent = newZineElement.outerHTML;
							event.detail.parameters['%s'] = htmlContent;
							event.detail.parameters['div_id'] = '%s';
						}
						});
					`, sessionID, sessionID, sessionID)),
		),
	)
}

func Zine(sessionID string) *Node {
	panels := loadPanelData(sessionID)

	return Div(Id(sessionID), ZinePage(), Class("text-black"),
		createPanel(panels["panel_2"], "panel_2"),
		createPanel(panels["panel_3"], "panel_3"),
		createPanel(panels["panel_4"], "panel_4"),
		createPanel(panels["panel_5"], "panel_5"),
		createPanel(panels["panel_1"], "panel_1"),
		createPanel(panels["panel_8"], "panel_8"),
		createPanel(panels["panel_7"], "panel_7"),
		createPanel(panels["panel_6"], "panel_6"),
	)
}

func loadPanelData(zineId string) map[string]PanelData {
	panelsFile := fmt.Sprintf("./data/zines/%s.json", zineId)

	var panels map[string]PanelData

	if _, err := os.Stat(panelsFile); os.IsNotExist(err) {
		return panels
	}

	file, err := os.ReadFile(panelsFile)
	if err != nil {
		return panels
	}

	err = json.Unmarshal(file, &panels)
	if err != nil {
		return panels
	}

	return panels
}

// =================================================================================================
//============================================ Handlers ============================================
// =================================================================================================

func (z *ZineMaker) GenerateImage(w http.ResponseWriter, r *http.Request) {
	r.ParseForm()
	prompt := r.FormValue("content")
	imageName, _ := NewOpenAIService(LoadConfig()).GenerateImage(r.Context(), prompt)
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

// =================================================================================================
//============================================ Chromedp ============================================
// =================================================================================================

type Versions struct {
	Screenshots []string `json:"screenshots"`
}

func currentVersion(zineId string) (error, int, Versions) {
	zineDir := fmt.Sprintf("./data/images/%s", zineId)
	var versions Versions
	if err := os.MkdirAll(zineDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create zine directory: %w", err), 0, versions
	}

	versionsFile := filepath.Join(zineDir, "versions.json")

	if _, err := os.Stat(versionsFile); os.IsNotExist(err) {
		// If the file doesn't exist, create it
		versions = Versions{Screenshots: []string{}}
	} else {
		// If the file exists, load the current versions
		file, err := os.ReadFile(versionsFile)
		if err != nil {
			return fmt.Errorf("failed to read versions.json: %w", err), 0, versions
		}
		err = json.Unmarshal(file, &versions)
		if err != nil {
			return fmt.Errorf("failed to parse versions.json: %w", err), 0, versions
		}
	}

	version := len(versions.Screenshots)

	return nil, version, versions
}

// captureDivScreenshotFromHTML captures a screenshot of a specific zine section and saves it.
func captureDivScreenshotFromHTML(htmlContent, zineId string) (error, string) {

	// Create a new context for ChromeDP
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Create the directory for the zine images if it doesn't exist
	zineDir := fmt.Sprintf("./data/images/%s", zineId)
	if err := os.MkdirAll(zineDir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create zine directory: %w", err), ""
	}

	// Path to the versions.json file
	versionsFile := filepath.Join(zineDir, "versions.json")

	// Load the versions.json file (or create it if it doesn't exist)
	var versions Versions

	err, version, versions := currentVersion(zineId)
	if err != nil {
		return err, ""
	}
	screenshotName := fmt.Sprintf("zine-%d.png", version+1)
	screenshotPath := filepath.Join(zineDir, screenshotName)

	htmlName := fmt.Sprintf("zine-%d.html", version+1)
	htmlPath := filepath.Join(zineDir, htmlName)
	fmt.Println("htmlPath: ", htmlPath)
	// Write the HTML content to a file (optional, to be used for Chrome navigation)
	err = os.WriteFile(fmt.Sprintf("./%s", htmlPath), []byte(htmlContent), 0644)
	if err != nil {
		return fmt.Errorf("failed to write HTML file: %w", err), ""
	}

	// Build the full file URL for ChromeDP
	fileURL := fmt.Sprintf("http://justshare.io/%s", htmlPath)
	// fileURL := fmt.Sprintf("http://localhost:8080/%s", htmlPath)

	// Capture the screenshot using ChromeDP
	var buf []byte
	err = chromedp.Run(ctx,
		chromedp.Navigate(fileURL),
		chromedp.WaitVisible(fmt.Sprintf("#%s", zineId)),
		chromedp.Screenshot(fmt.Sprintf("#%s", zineId), &buf, chromedp.NodeVisible),
	)
	if err != nil {
		return fmt.Errorf("failed to capture screenshot: %w", err), ""
	}

	// Save the screenshot to the appropriate directory
	err = os.WriteFile(screenshotPath, buf, 0644)
	if err != nil {
		return fmt.Errorf("failed to save screenshot: %w", err), ""
	}

	// Update the versions.json file
	versions.Screenshots = append(versions.Screenshots, screenshotName)
	versionsData, err := json.MarshalIndent(versions, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal versions: %w", err), ""
	}
	err = os.WriteFile(versionsFile, versionsData, 0644)
	if err != nil {
		return fmt.Errorf("failed to write versions.json: %w", err), ""
	}
	fmt.Printf("Saved screenshot: %s\n", screenshotPath)
	return nil, screenshotPath
}

// =================================================================================================
//============================================  Styles  ============================================
// =================================================================================================

func ZinePage() *Node {
	return Attr("style", "height: 794px; width: 1123px; margin: 20px auto; background-color: white; border: 1px solid black; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); box-sizing: border-box; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(2, 1fr);")
}

func ZinePanel() *Node {
	return Attr("style", "background-color: white; border: 1px solid black;  padding: 5px; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box;")
}

func ZinePanelUpsideDown() *Node {
	return Attr("style", "background-color: white; border: 1px solid black;  padding: 5px; display: flex; justify-content: center; align-items: center; overflow: hidden; box-sizing: border-box; transform: rotate(180deg);")
}

func PanelSelctionButton() *Node {
	return Attr("style", "background-color: rgb(6 78 59)")
}

func Image() *Node {
	return Attr("style", "max-width: 100%; object-fit: contain;")
}

func BodyStyle() *Node {
	return Attr("style", "font-family: Arial, sans-serif; margin: 20px; line-height: 1.5;")
}
