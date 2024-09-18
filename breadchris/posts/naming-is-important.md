---
created_at: "2024-02-14T21:38:56-08:00"
tags:
- blog/post
- thinkies
- justshare
title: Naming is Important
---

Why should we care so much about naming as developers? Code comes and goes, but language prevails. When a team is working on a project, they must develop a shared language on how things work, how they are structured, and how they are related. A database schema or language specification is such an important document that many developers will battle passionately over what columns are called. Mental models of how things go together are at odds when there are multiple words to describe the same thing. When these ideas proliferate throughout a project, classes, variables, and packages begin to adopt the naming convention. If little care was put into the original thought of what to call the "thing," a very involved refactoring effort is sure to follow.

Here is an example: I was thinking through some of what I think the terminology should be regarding my project: [justshare](https://github.com/justshare-io/justshare). Right now, I am using what feels like big enterprise lingo like " [content](https://github.com/justshare-io/justshare/blob/main/proto/content/content.proto#L16)" and " [providers](https://github.com/justshare-io/justshare/tree/main/pkg/providers)" to talk about things like a "blog post" or "Twitter." I am the only one developing this right now, so naming shouldn't matter as much. But when explaining justshare to people, I would say, "You share content with a provider, like your email or Twitter." It is very functional; I think it is obvious how the system works, but it isn't fun. I was obsessing over the name "justshare" because that is precisely what I would think when I see something online, an image, tweet, file, contact info, and give it to someone else. I wanted to "just share" it with them. So, to continue this line of thinking, I want to understand what terms would make sense. This is what I have so far:

### Find or make a thing.

You want to share some _thing_ with someone. It could be a file, a link, a note, or another thing.

### Share it with people.

You want to share it with someone. You could share it with a friend, a group of friends, or the whole world. You want to put a _thing_ in a _place_. Heh.

### Control who gets to see it.

You want to control who gets to see it. Just for you. Just for your friends. Just for your friends and their friends. Just for the whole world.

### Your thing is valuable.

You want to know who sees it. You want to know who likes it. You want to know who shares it. You want to know who comments on it. You want to know who makes a copy of it. You want to know who makes a derivative of it. You want to know who makes a derivative of a derivative of it. You want to know who makes a derivative of a derivative of a derivative of it. You want to know who makes a derivative of a derivative of a derivative of a derivative of it.

### Find and update your thing later.

When you want to share that thing again, it is effortless to find. Anyone with whom you have shared it sees the changes you make.

Naming is important, but remember there are no "perfect" names for things. Understand who you are building this for and what language your team can comprehend and build around.