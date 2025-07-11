package main

import (
	"lib0/environment"
	"lib0/object"
)

var isDevMode = environment.GetVariable("node_env") == "development"

type ContentAny struct {
	arr []interface{}
}

func NewContentAny(arr []interface{}) *ContentAny {
	if isDevMode {
		object.DeepFreeze(arr)
	}
	return &ContentAny{arr: arr}
}

func (c *ContentAny) GetLength() int {
	return len(c.arr)
}

func (c *ContentAny) GetContent() []interface{} {
	return c.arr
}

func (c *ContentAny) IsCountable() bool {
	return true
}

func (c *ContentAny) Copy() *ContentAny {
	return NewContentAny(c.arr)
}

func (c *ContentAny) Splice(offset int) *ContentAny {
	right := NewContentAny(c.arr[offset:])
	c.arr = c.arr[:offset]
	return right
}

func (c *ContentAny) MergeWith(right *ContentAny) bool {
	c.arr = append(c.arr, right.arr...)
	return true
}

func (c *ContentAny) Integrate(transaction *Transaction, item *Item) {}

func (c *ContentAny) Delete(transaction *Transaction) {}

func (c *ContentAny) Gc(store *StructStore) {}

func (c *ContentAny) Write(encoder UpdateEncoder, offset int) {
	len := len(c.arr)
	encoder.WriteLen(len - offset)
	for i := offset; i < len; i++ {
		encoder.WriteAny(c.arr[i])
	}
}

func (c *ContentAny) GetRef() int {
	return 8
}

func ReadContentAny(decoder UpdateDecoder) *ContentAny {
	len := decoder.ReadLen()
	cs := make([]interface{}, len)
	for i := 0; i < len; i++ {
		cs[i] = decoder.ReadAny()
	}
	return NewContentAny(cs)
}

type Transaction struct{}
type Item struct{}
type StructStore struct{}
type UpdateEncoder interface {
	WriteLen(length int)
	WriteAny(value interface{})
}
type UpdateDecoder interface {
	ReadLen() int
	ReadAny() interface{}
}