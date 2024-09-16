package html

import (
	"fmt"
	"testing"
)

func TestParse(t *testing.T) {
	htmlStr := `
		<ul class="menu bg-base-200 rounded-box w-56">
		  <li><a>Item 1</a></li>
		  <li>
		    <span class="menu-dropdown-toggle">Parent</span>
		    <ul class="menu-dropdown">
		      <li><a>Submenu 1</a></li>
		      <li><a>Submenu 2</a></li>
		    </ul>
		  </li>
		</ul>`

	// Parse and format the HTML into Go node structure
	goNode, err := ParseHTMLString(htmlStr)
	if err != nil {
		fmt.Println("Error parsing HTML:", err)
		return
	}

	// Print the Go node structure (the Go code rendering the HTML)
	fmt.Println(goNode.Render())
}
