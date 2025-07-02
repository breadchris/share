package main

import (
	"fmt"
)

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

func Test() {
	// This example shows how the TypeScript generation would work
	// Example Go code with function definitions would be:
	_ = `
package main

type CreateUserRequest struct {
	Name     string ` + "`json:\"name\"`" + `
	Email    string ` + "`json:\"email\"`" + `
	Age      int    ` + "`json:\"age,omitempty\"`" + `
}

type CreateUserResponse struct {
	ID       string ` + "`json:\"id\"`" + `
	Name     string ` + "`json:\"name\"`" + `
	Email    string ` + "`json:\"email\"`" + `
	Created  string ` + "`json:\"created\"`" + `
}

type GetUserRequest struct {
	ID string ` + "`json:\"id\"`" + `
}

type GetUserResponse struct {
	User *CreateUserResponse ` + "`json:\"user\"`" + `
	Found bool              ` + "`json:\"found\"`" + `
}

func CreateUser(req CreateUserRequest) (CreateUserResponse, error) {
	return CreateUserResponse{}, nil
}

func GetUser(req GetUserRequest) (GetUserResponse, error) {
	return GetUserResponse{}, nil
}
`

	// This would work if GenerateTSFromGoCode was in a package you could import
	// For now, let's just show what the generated output would look like
	fmt.Println("Generated TypeScript would include:")
	fmt.Println(`
export interface CreateUserRequest {
    name: string;
    email: string;
    age?: number;
}

export interface CreateUserResponse {
    id: string;
    name: string;
    email: string;
    created: string;
}

export interface GetUserRequest {
    id: string;
}

export interface GetUserResponse {
    user?: CreateUserResponse;
    found: boolean;
}

export interface FetchOptions {
    baseURL?: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export interface Response<T> {
    data: T;
    status: number;
    statusText: string;
}

export async function CreateUser(req: CreateUserRequest, options: FetchOptions = {}): Promise<Response<CreateUserResponse>> {
    const url = ` + "`${options.baseURL || ''}/createuser`" + `;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(` + "`HTTP error! status: ${response.status}`" + `);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}

export async function GetUser(req: GetUserRequest, options: FetchOptions = {}): Promise<Response<GetUserResponse>> {
    const url = ` + "`${options.baseURL || ''}/getuser`" + `;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(req)
    });

    if (!response.ok) {
        throw new Error(` + "`HTTP error! status: ${response.status}`" + `);
    }

    const data = await response.json();
    return {
        data,
        status: response.status,
        statusText: response.statusText
    };
}
`)

	fmt.Println("\nUsage example:")
	fmt.Println(`
// TypeScript usage:
const response = await CreateUser({
    name: "John Doe",
    email: "john@example.com",
    age: 30
}, {
    baseURL: "https://api.example.com"
});

console.log(response.data.id); // Type-safe access to response
`)
}
