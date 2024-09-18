---
created_at: "2024-02-21T01:00:25-08:00"
tags:
  - blog
title: The Figma Plugin System
---

Figma is a design tool that has become the industry standard, similar to how Photoshop became the defacto for photo editing. When everyone uses one tool, it only follows that there will be functionality that different groups of people need that isn’t immediately supported. To bridge the gap in functionality, a plugin system is the go-to solution for letting people extend a system how they see fit. Figma has a great set of blog posts on how they implemented their plugin system that is certainly worth reading, not just if you intend to build your own but also if you want to see how to reason about building a feature from first principles.

- [How to build a plugin system on the web and also sleep well at night](https://www.figma.com/blog/how-we-built-the-figma-plugin-system/)

- [An update on plugin security](https://www.figma.com/blog/an-update-on-plugin-security/)


The posts are great at discussing the technical details, but there are a number of different technologies being discussed that can be confusing to conceptualize. This is a great opportunity to explain some security concepts visually with sketches!

### The Catz Plugin [\#](\#the-catz-plugin)

Let’s say a developer wants to build a plugin called “Catz” that inserts a random cat picture into a Figma file. The developer needs to write **code** that can update the **file**. Since the Figma app runs in a web browser, the **code** could just be Javascript, and it runs on **[figma.com](http://figma.com)**.

![](https://i.imgur.com/WaQ16AM.jpeg)

But what if that code doesn’t do what the developer said? It turns out Catz is written by an evil dog who wants the whole world to pay more attention to good doggos! What if instead of inserting a cute fluff ball, it would mess with our file and change all the images to slobbering dogs, or worse, take over our account?!

The first line of defense might be a human reviewing the plugin to make sure it does what it says it does, but a hacker can be clever with hiding what they are doing. To ensure that the code the plugin is running can’t do whatever the hacker wants is important, and to do this we need what is often referred to as a **sandbox** (or **jail**).

A sandbox restricts what is allowed to be accessed by code. In the case of javascript code running on a page, we especially don’t want it to have access to **important browser things** like `document`, `window`, `eval`, etc., since these would let a hacker read and write anything they want to on the website.

Fortunately, browsers have a built-in sandboxing mechanism for running other people’s code called an **iframe**. Specifically, one that has the **sandbox** attribute: `<iframe sandbox="allow-scripts" src="dog.com/catz.js"` >. The important thing to note here is that the code runs with its origin set to **null** instead of **[figma.com](http://figma.com)**, meaning it is completely isolated from the figma. Unfortunately, there are some gotchas here because the code needs to pass messages between [figma.com](http://figma.com) and the isolated code which is slow, and developers found using `async/await` to be confusing (building plugins should be easy and fun!).

![](https://i.imgur.com/uMA93Qf.jpeg)

The solution used by the end of the initial post was Realm (now [Endo](https://github.com/endojs/endo/)). This is a library that moves the code back into the figma.com page but theoretically makes it impossible to do bad things by accessing those important browser things. This approach was fast and seemed to meet all the criteria.

That was until some pretty [devastating vulnerabilities](https://agoric.com/blog/technology/realms-shim-security-updates) were found in Realm. With some special code, the Catz plugin could get access to those important browser things and do whatever it wanted on [figma.com](http://figma.com) (since it is no longer protected by the iframe sandbox).

![](https://i.imgur.com/TONoD0n.jpeg)

Fortunately, Figma had invested some time in their initial research to consider another approach. What if the code ran in a way with zero concept of those important browser things? There is a cool up-and-coming browser technology called Web Assembly (WASM) which gets its name from assembly that your CPU might understand and run, but it runs in your browser. WASM is just a super simple set of instructions that, when combined together, can run a program of arbitrary complexity (known as Turing Complete). The reason this is cool is that there are different languages that can now compile to WASM and run performantly in the browser, C for example. QuickJS is a project written in C that implements an entire Javascript runtime. To put it together, instead of running the Catz plugin with the Javascript runtime that comes with the browser, you could compile _another_ Javascript runtime to WASM and then run that in the browser. This means that the plugin system now has full control over what the code can or cannot do.

![](https://i.imgur.com/98hvmT0.jpeg)

This was the solution that was ultimately used and I think demonstrates some pretty awesome capabilities of what modern browsers are capable of.