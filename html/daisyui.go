package html

import (
	"github.com/google/uuid"
	"path/filepath"
	"strings"
)

func ParseFilePaths(filePaths []string) Directory {
	root := Directory{Name: "Root"}
	dirMap := make(map[string]*Directory)

	for _, path := range filePaths {
		parts := strings.Split(filepath.ToSlash(path), "/")

		currentDir := &root

		for _, part := range parts[:len(parts)-1] {
			if _, exists := dirMap[part]; !exists {
				newDir := Directory{Name: part}
				currentDir.SubDirs = append(currentDir.SubDirs, newDir)
				dirMap[part] = &currentDir.SubDirs[len(currentDir.SubDirs)-1]
			}
			currentDir = dirMap[part]
		}

		fileName := parts[len(parts)-1]
		currentDir.Files = append(currentDir.Files, File{
			Name: fileName,
			Href: "/code?file=" + path,
		})
	}
	return root
}

func GenerateRenderDirectory(filePaths []string) *Node {
	dirStructure := ParseFilePaths(filePaths)
	return RenderDirectory(dirStructure)
}

type File struct {
	Name string
	Icon string
	Href string
}

type Directory struct {
	Name    string
	Files   []File
	SubDirs []Directory
}

func RenderDirectory(dir Directory) *Node {
	dirNode := Ul(Class("menu menu-xs bg-base-200 rounded-lg max-w-xs w-full"))

	for _, file := range dir.Files {
		dirNode.Children = append(
			dirNode.Children,
			Li(
				A(
					If(file.Href != "", Href(file.Href), Nil()),
					Text(file.Name),
				),
			),
		)
	}

	for _, subDir := range dir.SubDirs {
		dirNode.Children = append(
			dirNode.Children,
			Li(
				Details(
					Open(false),
					Summary(
						Text(subDir.Name),
					),
					RenderDirectory(subDir),
				),
			),
		)
	}

	return dirNode
}

type Tab struct {
	Title   string
	Content *Node
	Active  bool
}

func RenderTabs(tabs ...Tab) *Node {
	tabId := uuid.NewString()
	t := Div(
		Role("tablist"),
		Class("tabs tabs-bordered w-full"),
	)
	for _, tab := range tabs {
		input := Input(
			Type("radio"),
			Name(tabId),
			Role("tab"),
			Class("tab"),
			AriaLabel(tab.Title),
			Checked(tab.Active),
		)
		t.Children = append(t.Children, input)

		panel := Div(
			Role("tabpanel"),
			Class("tab-content"),
			tab.Content,
		)
		t.Children = append(t.Children, panel)
	}
	return t
}
