---
created_at: "2024-03-23T20:04:31-07:00"
tags: []
title: response to "static vs. dynamic types"
---

[Original](https://breadchris.com/thinkies/static-vs-dynamic-types/)

Ha thanks for sharing! What is your conclusion, I didn't quite get it, or you left it a bit open on purpose? Btw while there is certainly sometihng about ease of prototyping with dynamic languages, I do find protoyping with Haskell also very nice because it fits how I think -> I am thinking about types anyway, so it allows me to write them down and then takes care thinking about them instead of me. And Algebraic Data Types ( `data Name = First String | FirstAndLast String String | Nickname String`) are big part of this for me, they make it really easy to model the domain. I often start with types in Haskell, it allows me to define the domain, and then I jump into writing functions.

no conclusion, just an observation that I have made about patterns in languages

yes, you might think that way, but most developers do not. when you write a language that requires a certain way of thinking that is deviating from the normal way of thinking, then you aren't going to get as many libraries being written which are critical for the growth of a language. In addition to libraries, there is just less content available for you to learn from. Haskell suffers from this problem. I think haskell is a beautiful programming language, but it doesn't have as strong of a network effect as compared to go.