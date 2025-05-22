package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/breadchris/share/ai"
	"github.com/breadchris/share/config"
	"github.com/breadchris/share/db"
	"github.com/breadchris/share/deps"
	"github.com/breadchris/share/models"
	"github.com/google/uuid"
	"github.com/kkdai/youtube/v2"
	"github.com/samber/lo"
	"github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	"io"
	"io/fs"
	"os"
	"path"
	"testing"
)

func TestRecipeIndex(t *testing.T) {
	index, err := db.NewSearchIndex(recipeIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	r, err := index.Search("Cinnamon")
	if err != nil {
		fmt.Println("Error:", err)
	}
	fmt.Println(r.String())
}

func TestLoadAllRecipes(t *testing.T) {
	index, err := db.NewSearchIndex(recipeIndex)
	if err != nil {
		fmt.Println("Error:", err)
	}

	count := 0
	batch := index.Index.NewBatch()
	processFunc := func(name string, contents []byte) error {
		var data map[string]any

		// only match *.json files
		if path.Ext(name) != ".json" {
			return nil
		}

		count += 1
		if count%100 == 0 {
			fmt.Printf("Current file: %s\n", name)
			fmt.Printf("Processed %d files\n", count)
			err = index.Batch(batch)
			if err != nil {
				return err
			}
			batch = index.Index.NewBatch()
		}

		err = json.Unmarshal(contents, &data)
		if err != nil {
			return fmt.Errorf("error unmarshalling %s: %v", name, err)
		}

		return batch.Index(name, data)
	}

	fsys := os.DirFS("data/recipes")
	dir := "."
	err = fs.WalkDir(fsys, dir, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		file, err := fsys.Open(p)
		if err != nil {
			return err
		}
		defer file.Close()
		contents, err := io.ReadAll(file)
		if err != nil {
			return err
		}
		return processFunc(p, contents)
	})
	if err != nil {
		fmt.Println("Error:", err)
	}

	if err = index.Batch(batch); err != nil {
		fmt.Println("Error:", err)
	}
}

type TestPlaylist struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	URL         string `json:"url"`
}

func TestIngestChannels(t *testing.T) {
	channels := []TestPlaylist{
		{
			Name:        "Mr. Make It Happen",
			Description: "Pasta/Italian cooking videos",
			URL:         "https://www.youtube.com/watch?v=KDfWgcJRzMM&list=PLAWoAwc-OTEXpBhr_e3ip49KdyZBw5a16",
		},
		{
			Name:        "Joshua Weisman but cheaper",
			Description: "Video on YouTube",
			URL:         "https://www.youtube.com/watch?v=Hg_zVEuYP_Y&list=PL4WiRZw8bmXt9q1_5MhZWqfhIdFg3eINH",
		},
		{
			Name:        "Babish Universe",
			Description: "Video collection from Babish",
			URL:         "https://www.youtube.com/watch?v=ZLWGRgys-RI&list=PLopY4n17t8RBbvz-Z1XmMIHohNn7oTeRj",
		},
		{
			Name:        "Basics",
			Description: "Babish Universe basics",
			URL:         "https://www.youtube.com/watch?v=1AxLzMJIgxM&list=PLopY4n17t8RD-xx0UdVqemiSa0sRfyX19",
		},
		{
			Name:        "Epicurious",
			Description: "Epicurious video series",
			URL:         "https://www.youtube.com/watch?v=LsnEE5ykwCs&list=PLz3-p2q6vFYWzmnkvjYWF3vnxckIRNYEH",
		},
		{
			Name:        "Epicurious 101",
			Description: "Introductory videos from Epicurious",
			URL:         "https://www.youtube.com/watch?v=-jrzTWkHv-0&list=PLz3-p2q6vFYVmozlsVcX7egMe1Co9aiG0",
		},
		{
			Name:        "About to Eat",
			Description: "Video collection from About to Eat",
			URL:         "https://www.youtube.com/watch?v=0zxHF1unLuo&list=PLiP3qHye95hJXGfkzYfqHNr7YP2HdmFji",
		},
		{
			Name:        "Acooknamedmatt",
			Description: "Cooking videos from Acooknamedmatt",
			URL:         "https://www.youtube.com/watch?v=SYhl8b1gQWM&list=PL27g6IEJHIt6YXbrhRuDlkr9zzIukEhyw",
		},
		{
			Name:        "Kenji",
			Description: "Food lab basics",
			URL:         "https://www.youtube.com/watch?v=0SxlESaak_Q&list=PLXonhhg5tUSJuH6YK5UNOoT_I8TC5Sx_h",
		},
		{
			Name:        "Alessandra Ciuffo",
			Description: "Video collection from Alessandra Ciuffo",
			URL:         "https://www.youtube.com/watch?v=fx05s4f19n4&list=PLW3uUMYCug-92wsdBkIuPaxRj2Ftj7qCo&index=11",
		},
		{
			Name:        "Alex",
			Description: "Cooking videos from Alex",
			URL:         "https://www.youtube.com/watch?v=tcDk-JcAnOw&list=PLURsDaOr8hWX1T2WSXhPwL110La-GxjYY",
		},
		{
			Name:        "Alex - Pizza",
			Description: "Pizza making videos from Alex",
			URL:         "https://www.youtube.com/watch?v=YbkHihvXCPg&list=PLURsDaOr8hWUl0Kli7wG74qhtIXGTHHhZ",
		},
		{
			Name:        "Alex - Meatballs",
			Description: "Meatball cooking videos from Alex",
			URL:         "https://www.youtube.com/watch?v=tzGvGhQsWOk&list=PLURsDaOr8hWWt59j2IJlPADnmU6SS-tEk",
		},
		{
			Name:        "Noel Deyzel",
			Description: "Noel Deyzel's cooking videos",
			URL:         "https://www.youtube.com/watch?v=RNAFDVSzFa4&list=PLT4OnqcBgyE9Yv7slz_Kg9hU8adWuYaCz",
		},
		{
			Name:        "Alton Brown",
			Description: "Cooking videos from Alton Brown",
			URL:         "https://www.youtube.com/watch?v=RA5tqn6l7to&list=PLSL8Njz6ML7AqqhKWCaDVL43aM_ABr6YU",
		},
		{
			Name:        "Alvin Zhou",
			Description: "Video collection from Alvin Zhou",
			URL:         "https://www.youtube.com/@AlvinKZhou/videos",
		},
		{
			Name:        "ATK",
			Description: "Videos from ATK",
			URL:         "https://www.youtube.com/watch?v=NqmszTmcRyw&list=PLnbzopdwFrnbt5uZx46gvyskyu41z7hlQ",
		},
		{
			Name:        "What's Eating Dan",
			Description: "Cooking videos from What's Eating Dan",
			URL:         "https://www.youtube.com/watch?v=gqSpMYd0xyQ&list=PLnbzopdwFrnZc-UgGYETAQair7VzS7_Z8",
		},
		{
			Name:        "Andy Cooks",
			Description: "Classics from Andy Cooks",
			URL:         "https://www.youtube.com/watch?v=6XlMguO9r-M&list=PLtKhTy-t6gAgJ68_kv7O2GOYM_ZrfRGVI",
		},
		{
			Name:        "Ant's BBQ Cookout",
			Description: "BBQ basics from Ant's BBQ Cookout",
			URL:         "https://www.youtube.com/watch?v=MXfC2HTdI3Q&list=PLdGX7ca5nf2xx-nx3MX6A7tFG5hYuHsF9",
		},
		{
			Name:        "Bon Appetit",
			Description: "Cooking videos from Bon Appetit",
			URL:         "https://www.youtube.com/watch?v=hc3TEaT3WHA&list=PLKtIunYVkv_RfNmjLUZmnhtfypjTKI2QV&index=7",
		},
		{
			Name:        "Brian Lagerstrom",
			Description: "Taco videos from Brian Lagerstrom",
			URL:         "https://www.youtube.com/watch?v=oWG_UXtOrXE&list=PL_f8scwrXT8t1Loa0yYWRejNb2JWJxOnb",
		},
		{
			Name:        "Brian Lagerstrom - Casserole",
			Description: "Casserole cooking from Brian Lagerstrom",
			URL:         "https://www.youtube.com/watch?v=RwO10-czkLg&list=PL_f8scwrXT8ut7l5Pu8x-YbWsLGo1uWsx",
		},
		{
			Name:        "Brian Lagerstrom - Desserts",
			Description: "Dessert videos from Brian Lagerstrom",
			URL:         "https://www.youtube.com/watch?v=5oR29gOLyPU&list=PL_f8scwrXT8s4xDGNGLKbSPd2AF6p__HU",
		},
		{
			Name:        "Bruno Albouz",
			Description: "Cooking videos from Bruno Albouz",
			URL:         "https://www.youtube.com/@BrunoAlbouze",
		},
		{
			Name:        "Butcher Wizard",
			Description: "Videos from Butcher Wizard",
			URL:         "https://www.youtube.com/@ButcherWizard",
		},
		{
			Name:        "Carla Lalli Music",
			Description: "Chicken recipes from Carla Lalli Music",
			URL:         "https://www.youtube.com/watch?v=zFULY4-t7iY&list=PL7dILUMBZZFWu044Y7ZfOpLfqNlAk7mk1",
		},
	}

	c := config.New()
	docs := db.NewSqliteDocumentStore("data/docs.db")
	newDB := db.LoadDB(c.DB)
	d := deps.Deps{
		AIProxy: ai.New(c, newDB),
		AI:      openai.NewClient(c.OpenAIKey),
		Config:  c,
		Docs:    docs,
		DB:      newDB,
	}
	//yt := docs.WithCollection("youtube")

	for _, channel := range channels {
		if channel.Name != "Mr. Make It Happen" {
			continue
		}
		fmt.Printf("Name: %s\nDescription: %s\nURL: %s\n\n", channel.Name, channel.Description, channel.URL)
		//proxyFunc, err := CreateProxyFunction(d.Config.Proxy.URL, d.Config.Proxy.Username, d.Config.Proxy.Password)
		//if err != nil {
		//	panic(err)
		//}
		//
		//httpTransport := &http.Transport{
		//	Proxy:                 proxyFunc,
		//	IdleConnTimeout:       60 * time.Second,
		//	TLSHandshakeTimeout:   10 * time.Second,
		//	ExpectContinueTimeout: 1 * time.Second,
		//	ForceAttemptHTTP2:     true,
		//}

		client := youtube.Client{
			//HTTPClient: &http.Client{
			//	Transport: httpTransport,
			//},
		}

		ctx := context.Background()
		playlist, err := client.GetPlaylistContext(ctx, channel.URL)
		if err != nil {
			fmt.Printf("Error: %v\n", err)
			continue
		}

		for _, v := range playlist.Videos[:1] {
			//if v.ID != "-Ud2cqoB7gE" {
			//	continue
			//}
			var existingRecipe models.Recipe
			err = d.DB.Where("id = ?", v.ID).First(&existingRecipe).Error
			if err == nil {
				err := d.DB.Transaction(func(tx *gorm.DB) error {
					if err := tx.Where("recipe_id = ?", v.ID).Unscoped().Delete(&models.Ingredient{}).Error; err != nil {
						return err
					}
					if err := tx.Where("recipe_id = ?", v.ID).Unscoped().Delete(&models.Direction{}).Error; err != nil {
						return err
					}
					if err := tx.Where("recipe_id = ?", v.ID).Unscoped().Delete(&models.Equipment{}).Error; err != nil {
						return err
					}
					if err := tx.Where("id = ?", v.ID).Unscoped().Delete(&models.Recipe{}).Error; err != nil {
						return err
					}
					return nil
				})
				if err != nil {
					fmt.Printf("Error during transaction: %v\n", err)
					return
				}
			}

			rs := RecipeState{
				Recipe: Recipe{
					ID: v.ID,
				},
			}
			println("Recipe ID:", rs.Recipe.ID)
			vd, err := getVideo(d, rs)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				continue
			}
			println("Recipe Name:", vd.Title)

			var prompt string
			for _, tr := range vd.Transcript {
				prompt += fmt.Sprintf("[%d - %d] %s\n", tr.StartMs/1000, (tr.StartMs+tr.Duration)/1000, tr.Text)
			}

			var (
				ar AIRecipe
			)

			ct := ai.WithContextID(ctx, v.ID)
			ar, err = dataToRecipe(ct, d, prompt)
			if err != nil {
				fmt.Printf("Error: %v\n", err)
				continue
			}

			var r models.Recipe
			r.Model.ID = v.ID
			r.Name = ar.Name
			r.URL = fmt.Sprintf("https://www.youtube.com/watch?v=%s", v.ID)

			for i, ing := range ar.Ingredients {
				r.Ingredients = append(r.Ingredients, ing)
				r.Ingredients[i].ID = uuid.NewString()
				r.Ingredients[i].RecipeID = r.Model.ID
			}

			for i, dir := range ar.Directions {
				r.Directions = append(r.Directions, dir)
				r.Directions[i].ID = uuid.NewString()
				r.Directions[i].RecipeID = r.Model.ID
			}

			for i, eq := range ar.Equipment {
				r.Equipment = append(r.Equipment, eq)
				r.Equipment[i].ID = uuid.NewString()
				r.Equipment[i].RecipeID = r.Model.ID
			}

			r.Domain = channel.Name
			r.Transcript = models.MakeJSONField(vd.Transcript)

			err = d.DB.Create(&r).Error
			if err != nil {
				fmt.Printf("Error saving recipe: %v\n", err)
				continue
			}
		}
	}
}

func TestPrompt(t *testing.T) {
	id := "rdvm9M4I__E"

	c := config.New()
	docs := db.NewSqliteDocumentStore("data/docs.db")
	newDB := db.LoadDB(c.DB)
	d := deps.Deps{
		AIProxy: ai.New(c, newDB),
		AI:      openai.NewClient(c.OpenAIKey),
		Config:  c,
		Docs:    docs,
		DB:      newDB,
	}
	ctx := context.Background()

	var existingRecipe models.Recipe
	err := d.DB.Where("id = ?", id).First(&existingRecipe).Error
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	var prompt string
	for _, tr := range existingRecipe.Transcript.Data {
		prompt += fmt.Sprintf("[%d - %d] %s\n", tr.StartMs/1000, (tr.StartMs+tr.Duration)/1000, tr.Text)
	}

	ct := ai.WithContextID(ctx, id)
	ar, err := dataToRecipe(ct, d, prompt)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("Recipe Name:", ar.Name)
	fmt.Println("Ingredients:", ar.Ingredients)
	fmt.Println("Directions:", lo.Map(ar.Directions, func(d *models.Direction, _ int) string {
		return fmt.Sprintf("[%d - %d] %s", d.StartTime, d.EndTime, d.Text)
	}))
}

func TestCopyRecipesBetweenDatabases(t *testing.T) {
	// Assuming db.LoadDB takes a config or connection string and returns a gorm.DB instance
	c := config.New()
	db1 := db.LoadDB(c.DB)
	db2 := db.LoadDB(c.SupabaseURL)

	// Ensure both database connections are established
	assert.NotNil(t, db1)
	assert.NotNil(t, db2)

	// Query all rows from the 'recipes' table in the first database
	var recipes []models.Equipment
	err := db1.Find(&recipes).Error
	assert.NoError(t, err)
	assert.NotEmpty(t, recipes)

	// Insert the queried rows into the second database
	for _, recipe := range recipes {
		// It's assumed that the Recipe struct has the same structure in both databases
		// Insert the recipe into db2
		err := db2.Create(&recipe).Error
		assert.NoError(t, err, "Failed to insert recipe into the second database")
	}

	// Verify that the rows were successfully copied
	var count int64
	err = db2.Model(&models.Equipment{}).Count(&count).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(len(recipes)), count, "Recipe count mismatch between databases")
}
