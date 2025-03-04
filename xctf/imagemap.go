package xctf

import (
	"github.com/breadchris/share/deps"
	"net/http"
)

func NewImage(d deps.Deps) *http.ServeMux {
	m := http.NewServeMux()

	return m
}
