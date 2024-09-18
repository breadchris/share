package zine

import (
	. "github.com/breadchris/share/html2"
)

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
