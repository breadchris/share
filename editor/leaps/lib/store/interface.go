package store

//--------------------------------------------------------------------------------------------------

/*
Type - Implemented by types able to acquire and store documents. This is abstracted in order to
accommodate for multiple storage strategies. These methods should be asynchronous if possible.
*/
type Type interface {
	// Create - Create a new document.
	Create(Document) error

	// Read - Read a document.
	Read(ID string) (Document, error)

	// Update - Update an existing document.
	Update(Document) error
}

//--------------------------------------------------------------------------------------------------
