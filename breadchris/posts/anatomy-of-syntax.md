---
created_at: "2024-03-01T13:03:18-08:00"
tags:
- thinkies
- go
title: anatomy of syntax
---

Something I do not see often in programming language books is a concise explanation of semantic structures that are typically used. For example, in a Java method, there are different modifiers you can apply to the function to change how it behaves (public, private, static, etc.) Usually, the syntax is introduced and it is talked about at length, covering the many edge cases that might exist or the syntax is introduced in passing as an example requires a reader's comprehension of the topic, referencing a later section for the explaination.

The syntax is important, but I also find it really boring to explain. In the book that I want to write about Go, I want to find a balance between introducing syntax and showing something that is interesting to play with further. Coding is unique in that as long as you have something that can compute near you (laptop, phone, tablet, heck, your watch) you can see something happen. I want to build a mental model quickly, and let people loose with examples to experiment with. Maybe some slider bars or knobs if you only have two brain cells to run together while reading.

Go's syntax is so simple that you can introduce a lot very quickly. Here is how I would imagine introducing a struct:

\`\`\`go

// Define a struct named Person

type Person struct {

name string

age int

<field name> <type>

}

func main() {

// initialize a struct

person := Person{

name: "John",

age: 30,

<field name>: <value>

}

<variable> := <struct>{ <field name>: <value>, ..., }

// Access and print the fields of the person struct

println("Name:", person.firstName)

println("Age:", person.age)

<instance>.<field name>

}

\`\`\`

Writing this out, it kind of feels like integrating [BNF](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form#:~:text=In%20computer%20science%2C%20Backus%E2%80%93Naur,notation%20for%20context%2Dfree%20grammars.) into examples. Run through the Go [language spec](https://go.dev/ref/spec) and examples that run on the [playground](https://go.dev/play/) and you can cover a lot of ground quickly.