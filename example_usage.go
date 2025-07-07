package main

// Example request and response types
type CreateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Age   int    `json:"age,omitempty"`
}

type CreateUserResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Created string `json:"created"`
}

type GetUserRequest struct {
	ID string `json:"id"`
}

type GetUserResponse struct {
	User  *CreateUserResponse `json:"user"`
	Found bool                `json:"found"`
}

// Example API functions following the required pattern
func CreateUser(req CreateUserRequest) (CreateUserResponse, error) {
	// Implementation would go here
	return CreateUserResponse{}, nil
}

func GetUser(req GetUserRequest) (GetUserResponse, error) {
	// Implementation would go here
	return GetUserResponse{}, nil
}
