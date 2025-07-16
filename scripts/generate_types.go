package main

import (
	"fmt"
	"os"

	"github.com/breadchris/share/gots"
)

func main() {
	// Define the Go code containing the API functions
	goCode := `
package user

import (
	"github.com/breadchris/share/models"
)

type GetUserRequest struct {
	ID string `+"`json:\"id\"`"+`
}

type GetUserResponse struct {
	User models.User `+"`json:\"user\"`"+`
}

type ListGroupsRequest struct {
	UserID string `+"`json:\"user_id\"`"+`
}

type ListGroupsResponse struct {
	Groups []models.Group `+"`json:\"groups\"`"+`
}

type CreateGroupRequest struct {
	Name   string `+"`json:\"name\"`"+`
	UserID string `+"`json:\"user_id\"`"+`
}

type CreateGroupResponse struct {
	Group models.Group `+"`json:\"group\"`"+`
}

type JoinGroupRequest struct {
	JoinCode string `+"`json:\"join_code\"`"+`
	UserID   string `+"`json:\"user_id\"`"+`
}

type JoinGroupResponse struct {
	Group      models.Group           `+"`json:\"group\"`"+`
	Membership models.GroupMembership `+"`json:\"membership\"`"+`
}

type DeleteGroupRequest struct {
	GroupID string `+"`json:\"group_id\"`"+`
	UserID  string `+"`json:\"user_id\"`"+`
}

type DeleteGroupResponse struct {
	Success bool   `+"`json:\"success\"`"+`
	Message string `+"`json:\"message\"`"+`
}

type RemoveMemberRequest struct {
	MembershipID string `+"`json:\"membership_id\"`"+`
	UserID       string `+"`json:\"user_id\"`"+`
}

type RemoveMemberResponse struct {
	Success bool   `+"`json:\"success\"`"+`
	Message string `+"`json:\"message\"`"+`
}

func GetUser(req GetUserRequest) (GetUserResponse, error) {
	return GetUserResponse{}, nil
}

func ListGroups(req ListGroupsRequest) (ListGroupsResponse, error) {
	return ListGroupsResponse{}, nil
}

func CreateGroup(req CreateGroupRequest) (CreateGroupResponse, error) {
	return CreateGroupResponse{}, nil
}

func JoinGroup(req JoinGroupRequest) (JoinGroupResponse, error) {
	return JoinGroupResponse{}, nil
}

func DeleteGroup(req DeleteGroupRequest) (DeleteGroupResponse, error) {
	return DeleteGroupResponse{}, nil
}

func RemoveMember(req RemoveMemberRequest) (RemoveMemberResponse, error) {
	return RemoveMemberResponse{}, nil
}
`

	// Generate TypeScript types and API client
	tsCode, err := gots.GenerateTSFromGoCode(goCode)
	if err != nil {
		fmt.Printf("Error generating TypeScript: %v\n", err)
		os.Exit(1)
	}

	// Write to file
	outputFile := "./user-api.ts"
	err = os.WriteFile(outputFile, []byte(tsCode), 0644)
	if err != nil {
		fmt.Printf("Error writing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("TypeScript types and API client generated in %s\n", outputFile)
}