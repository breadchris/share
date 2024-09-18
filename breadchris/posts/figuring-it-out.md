---
created_at: "2024-01-27T21:09:07-08:00"
tags:
- 100daystooffload
title: Figuring it out
---

Someone shared [this](https://twitter.com/karpathy/status/1751350002281300461) with me today. They said: "yeah when I read this I thought of your exact thing lol". So it turns out that I am on to something. Let's take a look at how well I am meeting Andrej's ideal blogging platform:

- Writing

  - ✅ in markdown

  - ✅ with full WYSIWYG, not just split view (think: Typora)

    - I am using [https://tiptap.dev/](https://tiptap.dev/)
  - super easy to copy paste and add images

    - not yet, I have been itching to code this.

    - tiptap does have an [image thing](https://tiptap.dev/docs/editor/api/nodes/image), which should be easy to add, but there are some more things to think through (where do the images get uploaded to?)
- Deploying

  - ✅ renders into static pages (think: Jekyll)

    - SEO optimized with [hugo](https://gohugo.io/) and [papermod](https://github.com/adityatelange/hugo-PaperMod)
  - ✅ super simple, super minimal html with no bloat

    - [view-source:https://breadchris.com/blog/a-sustainable-thinker-always-wins/](view-source:https://breadchris.com/blog/a-sustainable-thinker-always-wins/)
  - ⌛ hosting at a nice url

    - I have my site hosted at a nice url, [breadchris.com](http://breadchris.com), but what is a normal user's experience?

      - I want to give you: [you.justshare.io](http://you.justshare.io)
    - What if people want to bring their own domain?

    - What if people could buy their custom domain through the site?
- Maintaining

  - ⌛ analytics (think: Google Analytics)

    - I started to write [the code](https://github.com/lunabrain-ai/lunabrain/blob/main/pkg/server/log.go#L49), but it isn't done.

    - My goal is to make it look like [simpleanalytics](https://simpleanalytics.com/simpleanalytics.com?from=landing)
  - ❌ comments section (think: Disqus)

    - TL; DR: I think there is much to explore here that I haven't thought through yet.

    - I personally really like the clap feature of medium (their UI hides the feature very well so not many people use it, imo)

    - I want to let people leave full length responses, but I want to give the author tools to decide to publish them or not.
- Ownership

  - ✅ full export, access/ownership of the raw files to perpetuity should the need arise to move elsewhere.

    - My blog posts get written to [a log](https://raw.githubusercontent.com/breadchris/notes/master/pages/lunabrain.md) that I include in LogSeq.

    - The database can be sqlite, so all your content is saved into a database

    - The code is all [open source](https://github.com/lunabrain-ai/lunabrain/tree/main)

    - Oh, and it runs as a single static executable. Not that anyone cares about that ;) we love node\_modules