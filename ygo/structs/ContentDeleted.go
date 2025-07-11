package internals

import (
	// Assuming appropriate imports here
)

type ContentDeleted struct {
	len int
}

func NewContentDeleted(len int) *ContentDeleted {
	return &ContentDeleted{len: len}
}

func (cd *ContentDeleted) GetLength() int {
	return cd.len
}

func (cd *ContentDeleted) GetContent() []interface{} {
	return []interface{}{}
}

func (cd *ContentDeleted) IsCountable() bool {
	return false
}

func (cd *ContentDeleted) Copy() *ContentDeleted {
	return NewContentDeleted(cd.len)
}

func (cd *ContentDeleted) Splice(offset int) *ContentDeleted {
	right := NewContentDeleted(cd.len - offset)
	cd.len = offset
	return right
}

func (cd *ContentDeleted) MergeWith(right *ContentDeleted) bool {
	cd.len += right.len
	return true
}

func (cd *ContentDeleted) Integrate(transaction *Transaction, item *Item) {
	AddToDeleteSet(transaction.DeleteSet, item.ID.Client, item.ID.Clock, cd.len)
	item.MarkDeleted()
}

func (cd *ContentDeleted) Delete(transaction *Transaction) {}

func (cd *ContentDeleted) GC(store *StructStore) {}

func (cd *ContentDeleted) Write(encoder Encoder, offset int) {
	encoder.WriteLen(cd.len - offset)
}

func (cd *ContentDeleted) GetRef() int {
	return 1
}

func ReadContentDeleted(decoder Decoder) *ContentDeleted {
	return NewContentDeleted(decoder.ReadLen())
}