---
created_at: "2024-03-08T16:44:42Z"
tags:
- go
- thinkies
title: go dependency injection
---

Dependency injection has radically increased my programming rate. When everything is designed as a module, you find yourself constantly reusing things you have already written since it is the path of least resistance.

If you try to do this without the help of a framework, you will find yourself writing and rewriting the boilerplate code to connect dependencies together. Most DI frameworks resolve dependency graphs at runtime [https://github.com/uber-go/fx](https://github.com/uber-go/fx)

A dependency graph resolved at runtime is error prone and leads to confusing code. Where does this instance come from? I was excited to find wire, compile-time dependency resolution. [https://github.com/google/wire](https://github.com/google/wire)

The dependency graph is resolved and compiled with a "go generate". The result is code which clearly communicates what instances are created and where they are going. [https://github.com/justshare-io/justshare/blob/main/pkg/cli/wire\_gen.go](https://github.com/justshare-io/justshare/blob/main/pkg/cli/wire_gen.go)

Wire's [docs](https://github.com/google/wire/blob/main/_tutorial/README.md) are...complete, but terse. I didn't really understand how to use it until I read June's [blog post](https://clavinjune.dev/en/blogs/golang-dependency-injection-using-wire/) on wire.