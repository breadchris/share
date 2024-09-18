---
created_at: "2024-03-02T14:15:39-08:00"
tags:
- blog/post
- web
title: sensible web stack decisions
---

I have so much goddamn respect for web developers. A long list of side projects has consumed a significant amount of my time and have been riddled with frustration. What is most frustrating when writing a web app is understanding what tools to use. React, Vue, Svelte? Tailwind, the component library of the week, SASS, CSS? Everyone has opinions, and the "principled" stances are mostly comparisons against other technologies. Over the past few years, I have spent a lot of time considering how to build web apps with a "modern" approach. Yes, you can still write HTML on your Apache server to get the job done, but there is significant value in understanding how to leverage something like React. Here are some technologies that I value not just for their tech but also philosophy:

## [Tailwind CSS](https://tailwindcss.com/)

I didn't want to like it, but it is the right tool for styling components. Early reluctance came from the unreadable HTML Tailwind class names, I just wanted stupidly simple Bootstrap. My opinions changed when I read [the blog post](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/) and then [the book](https://www.refactoringui.com/?ref=resources). It predates the library and discusses rules for styling sites that make sense. The artifact of the book is Tailwind CSS, a utility CSS framework that feels more like a design language for HTML. On top of this, I found the Bootstrap class names I was looking for with [DaisyUI](https://daisyui.com/). Together these tools are simply CSS, and allow for a robust design experience that will continue to work well into the future. There are reasonable [criticisms,](https://www.aleksandrhovhannisyan.com/blog/why-i-dont-like-tailwind-css/) but I believe something like Tailwind is the future.

## [esbuild](https://esbuild.github.io/)

I don't enjoy writing Javascript. Connecting data and code dependencies together feels brittle. There is a distinct absence of coherent design principles vital to a language's health. But holy crap, it is incredible what you can do with it. When working with a lot of JS, you need a bundler. I started cargo-culting bundling setups from other projects and found Webpack too slow and Babel transpalation configs incredibly confusing. Parcel, Vite, and Rollup, made their rounds as the shiny JS libraries of the week and looking under the hood I found the holy grail of JS build systems, esbuild. As a Go elitist, esbuild was poetry to me. The docs told me everything I needed to know about [configuring my project](https://github.com/justshare-io/justshare/blob/main/js/esbuild.mjs). Building and hot reloading are fast. God bless you [evanw](https://github.com/evanw), you are doing the Lord's work.

![](https://i.imgur.com/sYA1JRM.png)js project pages always look so sleek

## [React](https://react.dev/)

I think React is the best option for building stateful JS apps. The library options (with types) that exist for React vs Vue or Svelte are just better, and I think that is the most essential attribute. I have used Vue before, and it was okay, but I enjoy the functional way of thinking that React encourages. I was all about Svelte initially. But the decision to move from using [Typescript to JSDoc](https://github.com/sveltejs/svelte/pull/8569) was symbolic to me that it is not a project that is forward thinking. I reluctantly returned to React. I dream to use something like [reasonml](https://reasonml.github.io/), [elm](https://elm-lang.org/), [purescript](https://www.purescript.org/), but there are a handful of reasons these aren't great choices today.

## [htmx](https://htmx.org/)

I remember initially seeing the site and not understanding, but later [read the book](https://hypermedia.systems/) and had my mind blown. The intro might be boring to most, but I found it quite profound in explaining how we missed some core ideas of REST by making endpoints only return JSON. You can get more "reactivity" from your app by simply returning HTML than you think, and you don't have to manage an entire SPA to get it. I have hesitations regarding vigorously typing the view and controller layers, but I have been theorizing some solutions (most recently, I have been playing with [templ](https://templ.guide/)).

If you find your builds slow or code to be a burden to write, something better might exist. Just because I, a random programmer from the Internet, say that this tech works for me doesn't mean it will work for you and your particular project constraints. This stack of technology, however, was explicitly curated to work for the most significant number of use cases I could think of.

PS: Here are some great resources I frequent when writing web apps for my stack of tech choices:

- [Tailwind Cheatsheet](https://tailwindcomponents.com/cheatsheet/)

- [DaisyUI Docs](https://daisyui.com/docs/install/)

- [Heroicons](https://heroicons.com/)

- [A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)