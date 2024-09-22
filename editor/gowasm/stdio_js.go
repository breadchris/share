package gowasm

//go:wasmimport gojs github.com/breadchris/share/editor/gowasm.wasmConsoleWrite
func wasmConsoleWrite(fd int, data []byte)
