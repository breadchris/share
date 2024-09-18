---
created_at: "2024-03-21T19:56:30-07:00"
tags:
- thinkies
title: static vs dynamic types
---

The debate between statically and dynamically typed languages has always been a hot topic in software development. Designing types for a problem can feel like solving a puzzle—fun for some and frustrating for others. But the real question is: Do you know how to represent the domain? While the alpha engineer may claim they do, understanding a domain comes from observing patterns over time.

The challenge in business, where code is most commonly used, is collecting and understanding the data needed to define these types accurately. Loosening restrictions around data types can lead to less code and faster app development. However, as an app grows and more features are added, defining what the data looks like becomes essential to avoid errors and confusion for new developers.

Looking at foundational languages such as Lisp and Haskell, we can see the two ends of the spectrum in terms of how they handle and enforce types in programming languages.

Lisp is known for having a dynamic and loosely-typed type system. This means that in Lisp, variables do not have fixed types, and the type of a variable can change during runtime. This flexibility can be both a strength and a weakness of Lisp - it allows for rapid prototyping and easy manipulation of data, but it can also lead to errors and unexpected behavior if types are not carefully managed.

On the other hand, Haskell has a static and strongly-typed type system. In Haskell, every variable has a fixed type that is determined at compile time, and types are strictly enforced by the compiler. This means that Haskell programs are less prone to type-related errors and bugs, as the compiler will catch many common type errors before the program even runs. The type system also allows for powerful type inference, where the compiler can automatically determine the types of variables without explicit type annotations from the programmer.

Write me two code examples of using lisp and haskell to represent the same type. Make the type example funny to programmers. Make the type demonstrative of the type systems

let me think...

Sure! Here's an example of representing a type "CoffeeCup" in both Lisp and Haskell:

Lisp:

\`\`\`lisp

(defstruct coffee-cup

(brand "JavaJolt")

(size 16) ; in ounces

(is-full t)

(has-handle t))

\`\`\`

Haskell:

\`\`\`haskell

data CoffeeCup = CoffeeCup {

brand :: String,

size :: Int,

isFull :: Bool,

hasHandle :: Bool

} deriving Show

javaJoltCoffeeCup :: CoffeeCup

javaJoltCoffeeCup = CoffeeCup {

brand = "JavaJolt",

size = 16,

isFull = True,

hasHandle = True

}

\`\`\`

Python has introduced type annotations to improve communication, but they can be an afterthought and often fail to catch errors. Typescript provides stricter types for JavaScript, making it easier to understand the data used. However, the complexity of the type of system can lead to confusion and a burden on developer tools. Writing tests can be an alternative, but premature testing can be challenging to manage as functions change.

Even the most robust type system can start to resemble a dynamically typed language in a rapidly changing domain. Defining contracts for code interfaces can help manage these changes. The key to a successful type system lies in how developers feel when using libraries—clear communication through documentation is crucial, especially in dynamic languages where tooling is limited.