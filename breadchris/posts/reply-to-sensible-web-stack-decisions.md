---
created_at: "2024-03-04T03:48:46-08:00"
tags:
- thinkies
- replies
title: reply to "sensible web stack decisions"
---

In response to my [previous post](https://breadchris.com/blog/sensible-web-stack-decisions/):

martinsos:

I like it, very practical and honest! No preaching, just direct opinions. Quite fresh for a web dev article. Btw I competely shared that view on Tailwind that you had at the start, and I still have it in part, just because I didn't have enough time to learn more of it. It still seems weird that we are putting all the style directly into html, I can't read that and it doesn't show the intention, but I think I read they are not against classes at the end, it is just that even them you woudl then define with Tailwind.

Ok just read [https://adamwathan.me/css-utility-classes-and-separation-of-concerns/](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/) and this reminded of what I read on TailwindCSS. This really nicely explains it, and it is also convincing enough for me. I had this same journe, just never got past the "semantic" part, but this makes sense, instead of making up sematnic stuf for every piece of html, we instead have these predefined styles and we can still reuse them via CSS classes or UI components. Ok, makes a lot of sense! **[CSS Utility Classes and "Separation of Concerns"](https://adamwathan.me/css-utility-classes-and-separation-of-concerns/)**. Over the last several years, the way I write CSS has transitioned from a "semantic" approach to something more like what people call "functional CSS." In this post I explain how I got to this point and share some of the lessons and insights I've picked up along the way.

me:

my conclusion was that tailwindcss represents the start of a programming language for designing web apps. It looks awkward as classnames in html, but it is well supported because it is a language built directly on top of a standard (vs trying to design another language completely, and introduce a "new" technology) **.**

something that is missing that I would very much like to build is a simple web page builder with just tailwindcss classes. I want to drag and drop components from something like daisyui into the page and apply tailwindcss styles to it. I also want to have templating in this view so that I can see what my final page would look like in real time. something like [https://grapesjs.com/](https://grapesjs.com/) with the cheatsheet [https://tailwindcomponents.com/cheatsheet/](https://tailwindcomponents.com/cheatsheet/)