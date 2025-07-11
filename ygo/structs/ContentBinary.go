package main

import (
	"errors"
)

type UpdateDecoderV1 struct{}
type UpdateDecoderV2 struct{}
type UpdateEncoderV1 struct{}
type UpdateEncoderV2 struct{}
type StructStore struct{}
type Item struct{}
type Transaction struct{}

// Assume these methods exist
func (u *UpdateEncoderV1) WriteBuf(content []byte) {}
func (u *UpdateEncoderV2) WriteBuf(content []byte) {}
func (d *UpdateDecoderV1) ReadBuf() []byte         { return nil }
func (d *UpdateDecoderV2) ReadBuf() []byte         { return nil }

var errMethodUnimplemented = errors.New("method unimplemented")

type ContentBinary struct {
	content []byte
}

func NewContentBinary(content []byte) *ContentBinary {
	return &ContentBinary{content: content}
}

func (c *ContentBinary) GetLength() int {
	return 1
}

func (c *ContentBinary) GetContent() []interface{} {
	return []interface{}{c.content}
}

func (c *ContentBinary) IsCountable() bool {
	return true
}

func (c *ContentBinary) Copy() *ContentBinary {
	return NewContentBinary(c.content)
}

func (c *ContentBinary) Splice(offset int) (*ContentBinary, error) {
	return nil, errMethodUnimplemented
}

func (c *ContentBinary) MergeWith(right *ContentBinary) bool {
	return false
}

func (c *ContentBinary) Integrate(transaction *Transaction, item *Item) {}
func (c *ContentBinary) Delete(transaction *Transaction)                {}
func (c *ContentBinary) GC(store *StructStore)                          {}

func (c *ContentBinary) Write(encoder interface{}, offset int) {
	switch e := encoder.(type) {
	case *UpdateEncoderV1:
		e.WriteBuf(c.content)
	case *UpdateEncoderV2:
		e.WriteBuf(c.content)
	}
}

func (c *ContentBinary) GetRef() int {
	return 3
}

func ReadContentBinary(decoder interface{}) *ContentBinary {
	switch d := decoder.(type) {
	case *UpdateDecoderV1:
		return NewContentBinary(d.ReadBuf())
	case *UpdateDecoderV2:
		return NewContentBinary(d.ReadBuf())
	}
	return nil
}