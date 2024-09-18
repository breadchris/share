---
created_at: "2024-02-08T21:29:16-08:00"
tags:
- go
title: Why you should learn Go
---

You are a FAANG developer who writes excellent Go. You are inspired by the writing of Rob Pike. Write a bulleted list on why a developer who codes in scripting dynamic languages is unfamiliar with Go should learn the language. Focus on the common frustrations that a developer who uses NodeJS or Python has and why Go will help them. First and foremost, Go's standardized tooling and consistent semantics help speed up the process of writing software.

\- Go's standardized tooling

Here's an example of Go's standardized tooling:

In Go, there are several standardized tools that come with the language to assist with development, building, testing, and formatting code. One such tool is "go fmt", which is used to automatically format Go source code.

Let's say we have the following Go code in a file named "main.go":

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, World!")
}
```

To apply the standardized formatting using the "go fmt" tool, we can simply run the following command in the terminal or command prompt:

`go fmt main.go`

After running this command, the tool will automatically format the code according to the Go standard formatting rules, resulting in the following formatted code:

package main

import "fmt"

func main() {

fmt.Println("Hello, World!")

}

By applying the "go fmt" tool, we ensure that the code follows a consistent styling and indentation, making it more readable and maintainable across different Go projects and developers.

This is just one example of standardized tooling in Go. There are many other tools available, such as "go build" for compiling Go programs, "go test" for running tests, "go get" for fetching external packages, and more. These tools help Go developers streamline their workflows and maintain code quality.

: One of the biggest frustrations for developers using scripting dynamic languages like NodeJS or Python is the lack of standardized tooling. In Go, the tooling is built into the language and widely adopted, making it easier for developers to start coding without having to spend time configuring and setting up various tools.

One prominent example of standardized tooling in Go is the "go fmt" command that formats Go source code. Developers can simply execute this command, and it will automatically format their code according to the official Go formatting style.

For instance, if a developer is working on a Go project and wants to ensure the code is properly formatted, they can run the following command in their terminal:

go fmt ./...

This command will recursively format all the Go source files present in the current directory and its subdirectories.

In contrast, in scripting dynamic languages like NodeJS or Python, developers often have to rely on external code formatters or IDE extensions to achieve a similar effect. These formatters might have varying configurations, dependencies, or not work uniformly across different development environments. Thus, Go's standardized tooling eliminates the need for developers to spend time searching and configuring external formatting tools, enabling them to dive into coding quickly.

\- Consistent semantics: Go has a strong statically typed system with a concise and minimalistic syntax. This consistency in semantics helps developers avoid common issues and hard-to-find bugs that can arise in dynamically typed languages. By catching many errors at compile-time, Go reduces the need for extensive testing and debugging, ultimately speeding up the development process.

\- Performance: While scripting dynamic languages can be great for certain use cases, they tend to be slower than statically typed languages like Go. Go was designed with performance in mind and is known for its impressive execution speed. So, developers who are frustrated with the limitations on performance in their current language can greatly benefit from leveraging Go's capabilities.

\- Scalability: As applications grow in size and complexity, they often face challenges related to scalability. Go excels in building concurrent and high-performance systems, allowing developers to handle thousands of concurrent requests efficiently. This can address one of the common frustrations developers face when their dynamic language applications struggle to scale well.

\- Ease of deployment: Go's ability to compile into a single executable without any dependencies allows for easy deployment and distribution of applications. Developers who are used to dealing with complex dependency management and virtual environments in dynamic languages will find Go's deployment straightforward and less error-prone.

\- Concurrency primitives: Go's built-in support for lightweight goroutines and channels makes it easier to write concurrent code. This is particularly beneficial for developers who might find it challenging to handle concurrency in dynamic languages, where they need to resort to libraries or external tools to achieve similar functionality.

\- Robustness and safety: Go's static typing and extensive error checking contribute to code robustness. Combined with its clear and idiomatic approach to error handling, Go helps developers write more reliable software. This can be a refreshing change for developers who are frustrated with the lack of strict error handling practices in dynamic languages.

\- Rich standard library: Go has a comprehensive standard library that covers a wide range of functionalities, reducing the need for external dependencies. This eliminates the frustration of searching and integrating numerous third-party libraries, making it easier to start new projects and maintain existing ones.

\- Great learning opportunities: Learning a new language like Go helps developers expand their skill set and become more well-rounded. Understanding Go's unique features and design principles can enhance their overall programming ability and make them more versatile developers, opening up new career opportunities in the process.

\- Growing popularity and market demand: Go has gained significant popularity in recent years, with many leading tech companies adopting it for their projects. By learning Go, developers can position themselves for future job prospects and work on exciting projects in industries that heavily rely on Go, such as cloud computing, networking, and distributed systems.