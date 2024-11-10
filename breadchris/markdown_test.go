package breadchris

import (
	md "github.com/JohannesKaufmann/html-to-markdown"
	"log"
	"os"
	"testing"
)

//func TestLoad(t *testing.T) {
//	dir := "posts"
//
//	posts, err := posts.loadPostsFromDir(dir)
//	if err != nil {
//		log.Fatalf("Error loading posts: %v", err)
//	}
//
//	for _, post := range posts {
//		fmt.Printf("Title: %s\n", post.Title)
//		fmt.Printf("Tags: %v\n", post.Tags)
//		fmt.Printf("Created At: %s\n", post.CreatedAt)
//		fmt.Printf("Content: %s\n", post.Content)
//		fmt.Println("----------------------------")
//	}
//}

func TestHTMLToMarkdown(t *testing.T) {
	converter := md.NewConverter("", true, nil)

	f, err := os.ReadFile("test.html")
	if err != nil {
		log.Fatal(err)
	}

	markdown, err := converter.ConvertString(string(f))
	if err != nil {
		log.Fatal(err)
	}

	os.WriteFile("test.md", []byte(markdown), 0644)
}
