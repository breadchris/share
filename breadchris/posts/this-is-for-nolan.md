---
created_at: "2024-01-26T13:56:20-08:00"
tags:
- blog/post
title: This is for Nolan
---

\## SOLID principles

The set of five design principles for object-oriented programming that were first introduced by Robert C. Martin. These principles are intended to make software designs more understandable, flexible, and maintainable.

In Go, the SOLID principles can be applied as follows:

\### Single Responsibility Principle (SRP)

Example:

\`\`\`go

type UserService struct {

userRepository UserRepository

}

func (us \*UserService) CreateUser(user \*User) error {

return us.userRepository.Create(user)

}

func (us \*UserService) GetUserByID(id int) (\*User, error) {

return us.userRepository.GetById(id)

}

\`\`\`

In this example, the \`UserService\` has a single responsibility - to manage user-related operations. It does not have any knowledge of the underlying storage mechanism for the user data - this is delegated to the \`UserRepository\` interface.

\- ### Open/Closed Principle

\- Example:

 -

\`\`\`go

type Shape interface {

Area() float64

}

\- type Rectangle struct {

Width float64

Height float64

}

\- func (r \*Rectangle) Area() float64 {

return r.Width \* r.Height

}

\- type Circle struct {

Radius float64

}

\- func (c \*Circle) Area() float64 {

return math.Pi \* c.Radius \* c.Radius

}

\`\`\`

\- In this example, we define a \`Shape\` interface that defines an \`Area()\` method. The \`Rectangle\` and \`Circle\` structs both implement this interface, and provide their own implementation of the \`Area()\` method. Now, if we want to add a new shape, we can simply create a new struct that implements the \`Shape\` interface without having to modify the existing code.

\- ### Liskov Substitution Principle

\- Example:

 -

\`\`\`go

type Animal struct{}

\- func (a \*Animal) Speak() string {

return "Animal sound"

}

\- type Dog struct {

Animal

}

\- func (d \*Dog) Speak() string {

return "Woof!"

}

\- type Cat struct {

Animal

}

\- func (c \*Cat) Speak() string {

return "Meow!"

}

\`\`\`

\- In this example, the \`Dog\` and \`Cat\` structs inherit from the \`Animal\` struct. However, they each provide their own implementation of the \`Speak()\` method. By adhering to the LSP, we should be able to use an instance of \`Dog\` or \`Cat\` wherever we would have used an instance of \`Animal\` without modifying the behavior of the program.

\- ### Interface Segregation Principle

\- Example:

 -

\`\`\`

type Animal struct{}

\- func (a \*Animal) Speak() string {

return "Animal sound"

}

\- type Dog struct {

Animal

}

\- func (d \*Dog) Speak() string {

return "Woof!"

}

\- type Cat struct {

Animal

}

\- func (c \*Cat) Speak() string {

return "Meow!"

}

\`\`\`

\- In this example, the \`Dog\` and \`Cat\` structs inherit from the \`Animal\` struct. However, they each provide their own implementation of the \`Speak()\` method. By adhering to the LSP, we should be able to use an instance of \`Dog\` or \`Cat\` wherever we would have used an instance of \`Animal\` without modifying the behavior of the program.

\- Interface Segregation Principle (ISP):

\- Example:

 -

\`\`\`go

type UserRepository interface {

Create(user \*User) error

GetById(id int) (\*User, error)

}

\- type PasswordRepository interface {

CreateHash(password string) (string, error)

ValidatePassword(hash, password string) error

}

\`\`\`

In this example, we have two distinct interfaces - \`UserRepository\` and \`PasswordRepository\`. Each interface is specific to a particular responsibility - one for managing user-related operations, and one for managing password-related operations. This is preferable to having a single, monolithic interface that attempts to cover both responsibilities.

\- ### Dependency Inversion Principle

\- Example:

 -

\`\`\`

type Animal struct{}

\- func (a \*Animal) Speak() string {

return "Animal sound"

}

\- type Dog struct {

Animal

}

\- func (d \*Dog) Speak() string {

return "Woof!"

}

\- type Cat struct {

Animal

}

\- func (c \*Cat) Speak() string {

return "Meow!"

}

\`\`\`

\- In this example, the \`Dog\` and \`Cat\` structs inherit from the \`Animal\` struct. However, they each provide their own implementation of the \`Speak()\` method. By adhering to the LSP, we should be able to use an instance of \`Dog\` or \`Cat\` wherever we would have used an instance of \`Animal\` without modifying the behavior of the program.

\- ### Interface Segregation Principle (ISP):

\- Example:

 -

\`\`\`go

type UserRepository interface {

Create(user \*User) error

GetById(id int) (\*User, error)

}

\- type PasswordRepository interface {

CreateHash(password string) (string, error)

ValidatePassword(hash, password string) error

}

\`\`\`

In this example, we have two distinct interfaces - \`UserRepository\` and \`PasswordRepository\`. Each interface is specific to a particular responsibility - one for managing user-related operations, and one for managing password-related operations. This is preferable to having a single, monolithic interface that attempts to cover both responsibilities.

\- ### Full Example

\- Here is an example of a Go program that applies the SOLID principles:

 -

\`\`\`go

package main

import "fmt"

// Single Responsibility Principle:

// Each struct has only a single responsibility.

// User struct represents a user in the system.

type User struct {

ID int

FirstName string

LastName string

}

\- // UserService struct defines a service for managing users.

type UserService struct {

users \[\]User

}

// AddUser adds a new user to the service.

func (s \*UserService) AddUser(u User) {

s.users = append(s.users, u)

}

// GetUserByID returns the user with the given ID.

func (s \*UserService) GetUserByID(id int) User {

for \_, u := range s.users {

if u.ID == id {

return u

}

}

return User{}

}

// Open/Closed Principle:

// The UserService is open for extension, but closed for modification.

// We can add new functionality by implementing new interfaces,

// rather than modifying the existing UserService.

// UserRepository defines the interface for a user repository.

type UserRepository interface {

SaveUser(u User) error

FindUserByID(id int) (User, error)

}

\- // UserRepositoryImpl is a concrete implementation of the UserRepository interface.

// It uses the UserService to store and retrieve users.

type UserRepositoryImpl struct {

userService \*UserService

}

// SaveUser saves a user to the repository.

func (r \*UserRepositoryImpl) SaveUser(u User) error {

r.userService.AddUser(u)

return nil

}

// FindUserByID finds a user with the given ID in the repository.

func (r \*UserRepositoryImpl) FindUserByID(id int) (User, error) {

return r.userService.GetUserByID(id), nil

}

// Liskov Substitution Principle:

// The UserRepositoryImpl should be substitutable for the UserRepository interface.

// This means that we should be able to use either the interface or the concrete implementation

// without knowing which one we are using.

// UserController is a controller for managing users.

// It uses a UserRepository to store and retrieve users.

type UserController struct {

repository UserRepository

}

\- // NewUserController creates a new UserController.

func NewUserController(r UserRepository) \*UserController {

return &UserController{repository: r}

}

// CreateUser creates a new user.

func (c \*UserController) CreateUser(u User) error {

return c.repository.SaveUser(u)

}

// GetUserByID gets the user with the given ID.

func (c \*UserController) GetUserByID(id int) (User, error) {

return c.repository.FindUserByID(id)

}

func main() {

// Dependency Inversion Principle:

// The UserController depends on the UserRepository interface,

// rather than on the concrete UserRepositoryImpl.

// This allows us to use any implementation of the UserRepository interface with the UserController.

userService := &UserService{}

repository := &UserRepositoryImpl{userService: userService}

controller := NewUserController(repository)

user := User{ID: 1, FirstName: "John", LastName: "Doe"}

controller.CreateUser(user)

retrievedUser, \_ := controller.GetUserByID(1)

fmt.Println(retrievedUser)

}

\`\`\`

\- In this example, the \`User\` struct represents a user in the system and has only the data and methods that are related to a user. The \`UserService\` struct defines a service for managing users, and follows the Single Responsibility Principle by having only a single responsibility (managing users).

\- The \`UserRepository\` interface and the \`UserRepositoryImpl\` struct demonstrate the Open/Closed Principle by defining an interface that can be implemented by different types, rather than modifying the existing \`UserService\`. The \`UserRepositoryImpl\` also satisfies the Liskov Substitution Principle by being substitutable for the \`UserRepository\` interface.

\- Finally, the \`UserController\` struct applies the Dependency Inversion Principle by depending on the \`UserRepository\` interface, rather than on a specific implementation of the interface. This allows us to use any implementation of the \`UserRepository\` interface with the \`UserController\`. For example, a memory implementation of \`UserRepository\` could be used in unit tests and a real database implementation of \`UserRepository\` could be used in integration tests using test containers.

\- To summarize, the SOLID principles are a set of design principles for object-oriented programming that can help to make software designs more understandable, flexible, and maintainable. In Go, these principles can be applied by using structs, interfaces, and other language features to create modular, decoupled code that is easy to understand and extend.

\- Personally, following these principles have helped me to maintain a well tested, 50k+ line solo project.

\- Hope this was a useful read!

\- ## Questions

 -

\> Does this still fulfill SOLID, if \`UserService\` is removed (by moving the \`UserService\` logic to \`UserRepository\`)?

\- In this specific example it wouldn't explicitly violate any principles, but if you were using a real database you'd want to abstract the database queries away so that data access implementation details don't leak into your business logic.

\- To illustrate using the example above, let's remove the \`UserService\` logic and move it to \`UserRepositoryImpl\`:

 -

\`\`\`go

var ErrUserNotFound = errors.New("user was not found")

\- // Open/Closed Principle:

// The UserService is open for extension, but closed for modification.

// We can add new functionality by implementing new interfaces,

// rather than modifying the existing UserService.

// UserRepository defines the interface for a user repository.

type UserRepository interface {

SaveUser(u User) error

FindUserByID(id int) (User, error)

}

\- // UserRepositoryImpl is a concrete implementation of the UserRepository interface.

// It uses an explicit users slice

type UserRepositoryImpl struct {

users \[\]User

}

// SaveUser saves a user to the repository.

func (r \*UserRepositoryImpl) SaveUser(u User) error {

s.users = append(s.users, u)

return nil

}

// FindUserByID finds a user with the given ID in the repository.

func (r \*UserRepositoryImpl) FindUserByID(id int) (User, error) {

for \_, u := range s.users {

if u.ID == id {

return u, nil

}

}

\- return User{}, ErrUserNotFound

}

\`\`\`

\- This looks fine, functionality stays the same and we removed 17 lines of code, but let's add a few things.

\- What if we want to check if a user exists before saving it? We can do so with the following:

 -

\`\`\`go

// SaveUser saves a user to the repository.

func (r \*UserRepositoryImpl) SaveUser(u User) error {

for \_, user := range s.users {

if u.ID == user.ID {

return ErrUserWithIDExists

}

}

\- s.users = append(s.users, u)

return nil

}

\`\`\`

\- As our user base grows, maybe we want to add a unique \`username\` field to the \`User\`. We can add the field to the \`User\` struct and on save check if the username is unique and doesn't contain any bad words.

 -

\`\`\`go

var ErrUsernameExists = errors.New("user with username already exists")

\- type User struct {

ID int

FirstName string

LastName string

Username string

}

\- // SaveUser saves a user to the repository.

func (r \*UserRepositoryImpl) SaveUser(u User) error {

if badWords.Contains(u.Username) {

return ErrUsernameInvalid

}

\- for \_, user := range s.users {

if u.ID == user.ID {

return ErrUserWithIDExists

}

\- if u.Username == user.Username {

return ErrUsernameExists

}

}

\- s.users = append(s.users, u)

\- return nil

}

\`\`\`

\- Now if we wanted to rewrite SaveUser using an actual database:

 -

\`\`\`go

// SaveUser saves a user to the repository.

func (r \*UserRepositoryImpl) SaveUser(u User) error {

if badWords.Contains(u.Username) {

return ErrUsernameInvalid

}

\- users := r.db.Query("select \* from users").ScanStructs(User{})

for \_, user := range users {

if u.ID == user.ID {

return ErrUserWithIDExists

}

\- if u.Username == user.Username {

return ErrUsernameExists

}

}

\- return r.db.Exec("insert into users(id, first\_name, last\_name, username) values (?, ?, ?, ?)", u.ID, u.FirstName, u.LastName, u.Username)

}

\`\`\`

\- Still maintainable but it could look something like this which I personally find more readable:

 -

\`\`\`go

func (r \*UserRepositoryImpl) SaveUser(u User) error {

if badWords.Contains(u.Username) {

return ErrUsernameInvalid

}

\- users := r.repository.QueryAllUsers()

for \_, user := range users {

if u.ID == user.ID {

return ErrUserWithIDExists

}

\- if u.Username == user.Username {

return ErrUsernameExists

}

}

\- return r.repository.SaveUser(u)

}

\`\`\`

\- You could refactor even further:

 -

\`\`\`go

func (r \*UserRepositoryImpl) SaveUser(u User) error {

err := r.repository.ValidateUser(u);

if err != nil {

return err

}

\- return r.repository.SaveUser(u)

}

\`\`\`

\- Now it's even more clear what the code does: validate the input then save. By abstracting the implementation away from the intention, you can read more immediately know what SaveUser is supposed to do. And when you want to know how user validation or saving the user actually works, you can navigate to the definition at that point.