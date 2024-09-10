package gowasm

//go:wasmimport gojs github.com/breadchris/share/editor/internal/gowasm.wasmConsoleWrite
func wasmConsoleWrite(fd int, data []byte)
