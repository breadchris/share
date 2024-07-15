package main

import (
	"encoding/json"
	"fmt"
	"github.com/nlnwa/gowarc"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/gosimple/slug"
	"github.com/spf13/pflag"
)

func ensureDir(d string) {
	if _, err := os.Stat(d); os.IsNotExist(err) {
		os.Mkdir(d, 0755)
	}
}

func getArchiveFilename(providerName, recipeID string) string {
	return fmt.Sprintf("archive/%s/%s.warc.gz", providerName, recipeID)
}

func loadContentFromURL(providerName, recipeID string) (string, []byte, error) {
	archiveFilename := getArchiveFilename(providerName, recipeID)

	warcReader, err := gowarc.NewWarcFileReader(archiveFilename, 0)
	if err != nil {
		return "", nil, err
	}

	var content []byte
	var targetURL string
	for {
		record, _, _, err := warcReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return "", nil, err
		}
		if record.Type() == gowarc.Response {
			r, err := record.Block().RawBytes()
			if err != nil {
				return "", nil, err
			}
			body, err := io.ReadAll(r)
			if err != nil {
				return "", nil, err
			}
			if len(body) < 1024 {
				continue
			}
			content = body
			targetURL = record.WarcHeader().Get("WARC-Target-URI")
			break
		}
	}
	return targetURL, content, nil
}

func loadURL(name, recipeID, url string, headers map[string]string) error {
	if url == "" {
		fmt.Printf("%s url is None\n", recipeID)
		return nil
	}

	fmt.Printf("pulling %s %s: %s\n", name, recipeID, url)
	webArchiveFile := getArchiveFilename(name, recipeID)
	if _, err := os.Stat(webArchiveFile); err == nil {
		fmt.Printf("cached %s %s\n", name, recipeID)
		return nil
	}

	// Implement logic to capture HTTP requests and save to webArchiveFile
	// Placeholder for actual implementation

	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Printf("failed to pull %s %s\n", name, recipeID)
		body, _ := ioutil.ReadAll(resp.Body)
		fmt.Println(string(body))
		os.Remove(webArchiveFile)
		return fmt.Errorf("failed to pull %s %s", name, recipeID)
	}

	// Save response to webArchiveFile
	// Placeholder for actual implementation

	return nil
}

func filterProviders(provider string, recipeProviders map[string]RecipeProvider) map[string]RecipeProvider {
	filtered := make(map[string]RecipeProvider)
	for k, v := range recipeProviders {
		if provider != "" && k == provider {
			filtered[k] = v
		}
	}
	return filtered
}

func cacheRecipeContent(provider string, recipeID string, recipeProviders map[string]RecipeProvider) {
	filteredProviders := filterProviders(provider, recipeProviders)
	for name, provider := range filteredProviders {
		providerDir := filepath.Join("data", "archive", name)
		ensureDir(providerDir)

		var wg sync.WaitGroup
		sem := make(chan struct{}, 20)
		for recipeID, url := range provider.GetURLs(recipeID) {
			wg.Add(1)
			sem <- struct{}{}
			go func(name, recipeID, url string) {
				defer wg.Done()
				defer func() { <-sem }()
				err := loadURL(name, recipeID, url, provider.Headers)
				if err != nil {
					fmt.Println(err)
				}
			}(name, recipeID, url)
		}
		wg.Wait()
	}
}

func processRecipe(provider RecipeProvider, providerName, recipe string) {
	parts := strings.Split(recipe, ".")
	recipeID := parts[0]
	url, pageContent, err := loadContentFromURL(providerName, recipeID)
	if err != nil || url == "" {
		fmt.Printf("unable to load recipe %s %s\n", providerName, recipeID)
		return
	}

	fmt.Printf("parsing %s %s %s\n", providerName, recipeID, url)
	recipeData, err := provider.GetRecipe(recipeID, url, pageContent)
	if err != nil {
		fmt.Println(err)
		return
	}

	providerDir := filepath.Join("recipes", providerName)
	ensureDir(providerDir)

	recipeSaveFile := filepath.Join(providerDir, fmt.Sprintf("%s.json", recipeID))
	fmt.Printf("saving recipe %s\n", recipeSaveFile)
	file, err := os.Create(recipeSaveFile)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(recipeData)
	if err != nil {
		fmt.Println(err)
	}
}

func processRecipeContent(provider string, recipeID string, recipeProviders map[string]RecipeProvider) {
	filteredProviders := filterProviders(provider, recipeProviders)
	for providerName, provider := range filteredProviders {
		recipes, err := os.ReadDir(filepath.Join("archive", providerName))
		if err != nil {
			fmt.Println(err)
			continue
		}
		if recipeID != "" {

		}

		var wg sync.WaitGroup
		sem := make(chan struct{}, 20)
		for _, recipe := range recipes {
			wg.Add(1)
			sem <- struct{}{}
			go func(recipe os.DirEntry) {
				defer wg.Done()
				defer func() { <-sem }()
				processRecipe(provider, providerName, recipe.Name())
			}(recipe)
		}
		wg.Wait()
	}
}

func normalizeRecipe(provider RecipeProvider, providerName, recipeFilename string) {
	parts := strings.Split(recipeFilename, ".")
	recipeID := parts[0]

	fmt.Printf("normalizing recipe %s %s\n", providerName, recipeFilename)
	file, err := os.Open(filepath.Join("recipes", providerName, recipeFilename))
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	var recipeModel map[string]interface{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&recipeModel)
	if err != nil {
		fmt.Println(err)
		return
	}

	if recipeModel == nil {
		fmt.Printf("recipe not able to be loaded: %s\n", recipeID)
		return
	}

	recipe, err := provider.NormalizeRecipe(recipeID, recipeModel)
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println(recipe)

	providerDir := filepath.Join("data", "normalized", providerName)
	ensureDir(providerDir)

	recipeSaveFile := filepath.Join(providerDir, fmt.Sprintf("%s.json", recipeID))
	fmt.Printf("saving recipe %s\n", recipeSaveFile)
	file, err = os.Create(recipeSaveFile)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(recipe)
	if err != nil {
		fmt.Println(err)
	}
}

func normalizeRecipes(provider string, recipeID string, recipeProviders map[string]RecipeProvider) {
	filteredProviders := filterProviders(provider, recipeProviders)
	for providerName, provider := range filteredProviders {
		recipes, err := os.ReadDir(filepath.Join("recipes", providerName))
		if err != nil {
			fmt.Println(err)
			continue
		}
		if recipeID != "" {
			// TODO breadchris
		}

		var wg sync.WaitGroup
		sem := make(chan struct{}, 20)
		for i := 0; i < len(recipes); i += 100 {
			for _, recipe := range recipes[i : i+100] {
				wg.Add(1)
				sem <- struct{}{}
				go func(recipe os.DirEntry) {
					defer wg.Done()
					defer func() { <-sem }()
					normalizeRecipe(provider, providerName, recipe.Name())
				}(recipe)
			}
			wg.Wait()
			// Placeholder for actual implementation of save_parsed_ingredients
		}
	}
}

func formatRecipe(recipe map[string]interface{}) map[string]interface{} {
	source := recipe["source"].(string)
	parsedSource, err := url.Parse(source)
	var sourceName string
	if err == nil {
		sourceName = strings.Split(parsedSource.Hostname(), ".")[0]
	} else {
		sourceName = source
	}

	recipeSlug := slug.Make(sourceName + "-" + recipe["name"].(string))

	directions := recipe["recipe_directions"].([]interface{})
	if directions == nil {
		panic(fmt.Sprintf("directions do not exist on %s", recipe))
	}

	var formattedDirections []map[string]interface{}
	for i, step := range directions {
		formattedDirections = append(formattedDirections, map[string]interface{}{
			"seq_num": i,
			"step":    step,
		})
	}

	var tags []string
	if recipe["recipe_tags"] != nil {
		for _, t := range recipe["recipe_tags"].([]interface{}) {
			tags = append(tags, t.(string))
		}
	}

	var formattedTags []map[string]interface{}
	for i, name := range tags {
		formattedTags = append(formattedTags, map[string]interface{}{
			"seq_num": i,
			"name":    strings.ToLower(name),
		})
	}

	ingredientGroups := recipe["recipe_ingredient_groups"].([]interface{})
	var formattedRecipeIngredientGroups []map[string]interface{}
	for i, ig := range ingredientGroups {
		ingredients := ig.(map[string]interface{})["ingredients"].([]interface{})
		var formattedIngredients []map[string]interface{}
		for j, ingredient := range ingredients {
			formattedIngredients = append(formattedIngredients, map[string]interface{}{
				"seq_num": j,
				"name":    ingredient.(map[string]interface{})["name"],
				"amount":  ingredient.(map[string]interface{})["amount"],
				"units":   ingredient.(map[string]interface{})["units"],
				"comment": ingredient.(map[string]interface{})["comment"],
				"text":    ingredient.(map[string]interface{})["text"],
			})
		}
		formattedRecipeIngredientGroups = append(formattedRecipeIngredientGroups, map[string]interface{}{
			"seq_num": i,
			"name":    ig.(map[string]interface{})["name"],
			"group_ingredients": map[string]interface{}{
				"data":        formattedIngredients,
				"on_conflict": map[string]interface{}{"constraint": "recipe_ingredients_group_id_seq_num_key", "update_columns": []string{"name", "amount", "units", "comment", "text"}},
			},
		})
	}

	return map[string]interface{}{
		"name":                     recipe["name"],
		"source":                   recipe["source"],
		"image":                    recipe["image"],
		"slug":                     recipeSlug,
		"video":                    recipe["video"],
		"recipe_directions":        map[string]interface{}{"data": formattedDirections, "on_conflict": map[string]interface{}{"constraint": "recipe_directions_recipe_id_seq_num_key", "update_columns": []string{"step"}}},
		"recipe_ingredient_groups": map[string]interface{}{"data": formattedRecipeIngredientGroups, "on_conflict": map[string]interface{}{"constraint": "recipe_ingredient_groups_recipe_id_seq_num_key", "update_columns": []string{"name"}}},
		"recipe_tags":              map[string]interface{}{"data": formattedTags, "on_conflict": map[string]interface{}{"constraint": "recipe_tags_recipe_id_name_key", "update_columns": []string{"name"}}},
		"extraction_metadata":      recipe["extraction_metadata"],
	}
}

func formatRecipeForWasp(recipe map[string]interface{}) map[string]interface{} {
	source := recipe["source"].(string)
	parsedSource, err := url.Parse(source)
	var sourceName string
	if err == nil {
		sourceName = strings.Split(parsedSource.Hostname(), ".")[0]
	} else {
		sourceName = source
	}

	var sourceURL string
	switch sourceName {
	case "americastestkitchen":
		sourceName = "America's Test Kitchen"
		sourceURL = "https://americastestkitchen.com"
	case "seriouseats":
		sourceName = "Serious Eats"
		sourceURL = "https://seriouseats.com"
	case "nytimes":
		sourceName = "New York Times"
		sourceURL = "https://cooking.nytimes.com"
	case "epicurious":
		sourceName = "Epicurious"
		sourceURL = "https://epicurious.com"
	case "joshuaweissman":
		sourceName = "Joshua Weissman"
		sourceURL = "https://joshuaweissman.com"
	}

	directions := recipe["recipe_directions"].([]interface{})
	if directions == nil {
		panic(fmt.Sprintf("directions do not exist on %s", recipe))
	}

	var extendedDirections []string
	for _, direction := range directions {
		extendedDirections = append(extendedDirections, strings.Split(direction.(string), ". ")...)
	}

	var formattedDirections []map[string]interface{}
	for _, step := range extendedDirections {
		formattedDirections = append(formattedDirections, map[string]interface{}{
			"text": step,
		})
	}

	ingredientGroups := recipe["recipe_ingredient_groups"].([]interface{})
	var formattedIngredients []map[string]interface{}
	for _, ig := range ingredientGroups {
		for _, ingredient := range ig.(map[string]interface{})["ingredients"].([]interface{}) {
			formattedIngredients = append(formattedIngredients, map[string]interface{}{
				"text":    ingredient.(map[string]interface{})["text"],
				"name":    ingredient.(map[string]interface{})["name"],
				"amount":  ingredient.(map[string]interface{})["amount"],
				"unit":    ingredient.(map[string]interface{})["units"],
				"comment": ingredient.(map[string]interface{})["comment"],
			})
		}
	}

	return map[string]interface{}{
		"name":        recipe["name"],
		"source":      sourceName,
		"sourceUrl":   sourceURL,
		"sourcePath":  source,
		"imageUrl":    recipe["image"],
		"directions":  formattedDirections,
		"ingredients": formattedIngredients,
		"videoUrl":    recipe["video"],
	}
}

func processRecipeFile(recipeFile string) (map[string]interface{}, error) {
	file, err := os.Open(recipeFile)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var recipe map[string]interface{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&recipe)
	if err != nil {
		return nil, err
	}

	return formatRecipeForWasp(recipe), nil
}

func verifyRecipeFile(recipeFile string) string {
	file, err := os.Open(recipeFile)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	defer file.Close()

	var recipe map[string]interface{}
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&recipe)
	if err != nil {
		fmt.Println(err)
		return ""
	}

	var issue string
	for _, ig := range recipe["recipe_ingredient_groups"].([]interface{}) {
		for _, ingredient := range ig.(map[string]interface{})["ingredients"].([]interface{}) {
			if ingredient.(map[string]interface{})["name"] == nil {
				fmt.Printf("ingredient is not parsed: %v\n", ingredient)
				continue
			}

			if !strings.Contains(ingredient.(map[string]interface{})["text"].(string), ingredient.(map[string]interface{})["name"].(string)) {
				issue = fmt.Sprintf("ingredient is not parsed correctly: %v", ingredient)
			}
		}
	}

	return issue
}

func verifyNormalizedRecipes(provider string, recipeID string, recipeProviders map[string]RecipeProvider) {
	recipeFolder := filepath.Join("data", "normalized", provider)

	recipeFiles, err := os.ReadDir(recipeFolder)
	if err != nil {
		fmt.Println(err)
		return
	}
	if recipeID != "" {
	}

	var recipesWithIssues [][]string

	for _, recipeFile := range recipeFiles {
		fmt.Printf("verifying %s\n", recipeFile.Name())
		recipePath := filepath.Join(recipeFolder, recipeFile.Name())
		issue := verifyRecipeFile(recipePath)

		if issue != "" {
			recipesWithIssues = append(recipesWithIssues, []string{recipePath, issue})
		}
	}

	fmt.Println(recipesWithIssues)
}

type RecipeProvider struct {
	Headers         map[string]string
	GetURLs         func(string) map[string]string
	GetRecipe       func(string, string, []byte) (map[string]interface{}, error)
	NormalizeRecipe func(string, map[string]interface{}) (map[string]interface{}, error)
}

func recipeCLI() {
	var step, provider, recipeID string
	pflag.StringVarP(&step, "step", "s", "", "Step to execute")
	pflag.StringVarP(&provider, "provider", "p", "", "Provider")
	pflag.StringVarP(&recipeID, "recipe", "r", "", "Recipe ID")
	pflag.Parse()

	if step == "" {
		fmt.Println("usage: <step> [provider] [recipe id]")
		return
	}

	recipeProviders := make(map[string]RecipeProvider) // Initialize with actual providers

	switch step {
	case "cache":
		cacheRecipeContent(provider, recipeID, recipeProviders)
	case "process":
		processRecipeContent(provider, recipeID, recipeProviders)
	case "normalize":
		normalizeRecipes(provider, recipeID, recipeProviders)
	case "verify":
		verifyNormalizedRecipes(provider, recipeID, recipeProviders)
	default:
		fmt.Println("no action performed")
	}
}
