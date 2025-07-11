package main

import (
	"errors"
)

var (
	ErrMethodUnimplemented = errors.New("method unimplemented")
)

type AbstractStruct struct {
	ID     ID
	Length int
}

func NewAbstractStruct(id ID, length int) *AbstractStruct {
	return &AbstractStruct{
		ID:     id,
		Length: length,
	}
}

func (as *AbstractStruct) Deleted() bool {
	panic(ErrMethodUnimplemented)
}

func (as *AbstractStruct) MergeWith(right *AbstractStruct) bool {
	return false
}

func (as *AbstractStruct) Write(encoder interface{}, offset, encodingRef int) {
	panic(ErrMethodUnimplemented)
}

func (as *AbstractStruct) Integrate(transaction *Transaction, offset int) {
	panic(ErrMethodUnimplemented)
}

// Mock classes to assume similar structure as in the provided JS code.
type ID struct {}
type Transaction struct {}
type UpdateEncoderV1 struct {}
type UpdateEncoderV2 struct {}