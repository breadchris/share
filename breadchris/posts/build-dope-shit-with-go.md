---
created_at: "2024-02-13T17:24:27-08:00"
tags:
- blog/post
- go
title: Build dope shit with go
---

The goal for this year is to: "write and publish something every day." So far I have been doing a good job keeping up with this. In my pursuit to build larger compositions of thoughts, next year will be themed accordingly; I want to write a book. How does one go about choosing the topic to write a book about? It is probably something that you spend a lot of time thinking about. I have many things that I can't stop thinking about, so I will have to pick one to start at least. Maybe this will change by next year, but I want to write a book about Go.

Go is a programming language that has profoundly shaped my thinking about code. Many things go beyond the language and speak more to the philosophy of writing code that solves a problem now and in the future. Many excellent books exist, and I wouldn't say I like reiterating information already abundantly available. This means that I don't want to cover things like the language's syntax all that much. Instead, I want to focus on the patterns in and around Go that have impacted my workflow for building and shipping code. More specifically, I want to look at what it means for something to feel more "go." I have spent a lot of time writing in the language, and I have learned some things that are worth sharing.

Here are some topics that come to mind at the moment:

- toolchain

  - benchmarking
- standard library

- structured logging

- channels

- error handling

- config

  - https://github.com/uber-go/config
- dependency injection

  - go wire
- database

  - ent
- grpc

  - connect
- deployment

  - single binary

I thought it would be fun to have an application built throughout the book that unifies all the topics together. Perhaps the example is the recipe site I built and rebuilt to pursue what coding patterns feel "right."