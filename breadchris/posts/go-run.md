---
created_at: "2024-02-21T13:59:44-08:00"
tags:
- go
- blog/post
title: go run
---

It may seem silly, but `go run` is my favorite part about go. Want to run your code? `go run main.go`. It is so stupidly simple that I could tell my mom about this command, and she would immediately understand. Like with most things in go, the real power in this command is in the effortless understanding of how to build and run everyone's code.

But I can run `node main.js`? Yeah, and then what happens if you want to use modern syntax like esmodule, or maybe you want to use types with typescript? You are going to have to use `npm`.

The tools you use to build and run code are often disparate in a language. As a project maintainer, you must understand community practices and conventions of correctly setting up a project. Third-party libraries are often required to run even the simplest of code. For example, in the Ruby programming language, the "rake" build tool became popular because of its versatility and the fact that it was used in many open-source projects. Similarly, in the JavaScript community, the adoption of npm as a build tool was driven by the widespread use of npm packages and modules.

Languages grow and change over time, and it is only natural that tools come and go as well. C and C++ have historically had "make" since the 1970s; Java grew from "ant" in the 1990s to Maven in the early 2000s. Different requirements for your application influence the tools that are developed and, by extension, influence people's workflows.

This is precisely the reason I love `go run` so much. Go's entire design brings power to the command. Simple syntax, static typing, and a strict dependency management system allow the compiler to quickly parse and analyze source code, leading to build times faster. Faster build times mean a broader reach of who could use the language to achieve their goals. It is funny; you will occasionally see a go project that includes a `Makefile`, but the compilation step is just a `go build` (build; don't run the code). Old habits die hard.

Fun fact: One of the understated features `go run` is that it will automatically download any dependencies the code references; how cool is that!

The more I program in other languages, the more I feel the painful absence of a standardized build system. I find it frustrating to keep up with the latest and greatest build system for something as common as running code. For something so critical to my understanding of how to code, such as how to run it, I find it unacceptable not to have a reliable foundation of knowledge.

Do not compromise with hacks or workarounds for critical components of your software development flow. Take ownership of the tools you use and fight for change so that you and everyone else benefit. When experience is shared, problems are solved, days of people's lives are saved, and passion for programming continues to grow, not wane.

comments:

bun run :) bun hing.ts same with python but not compiled you need to install python that’s the beauty of go for me even rust you need a cargo file

amazing, for js we not only have npm, yarn, pnpm, and bower (am I missing any?) but we also have completely new runtimes [bun](https://bun.sh/) and [deno](https://deno.com/). these are not evil, but tread lightly. Is VC backed deno going to fold as a company? maybe bun gets burnt and we are onto the next one. meanwhile I will be here with my boring `go run`