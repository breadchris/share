---
created_at: "2024-03-28T12:44:09-07:00"
tags:
- go
- thinkies
title: notes about coroutines?
---

Even though the "go" keyword is the same name as the language, you would think this is more commonly used. From my experience, go developers, including myself, will avoid using go routines and channels as much as possible. The reason is that it adds complexity that you often don't need. Concurrent code unlocks a lot of performance as tasks that would otherwise "stop the world" only stop the go routine that they are on. Being comfortable using channels is important if you want to optimize for performance, but their usage should be thought through first. Can I implement this as a for loop right now? A typical pattern when you start using channels is to have a group of workers process items from your channel. A worker pool can come in different forms and be configured with different parameters. For example, let's say you want to implement a queue that is backed by the database. To ensure that every item added to the channel is processed, you can add a "ready" channel to ensure there is at least one worker who can immediately handle the data you are sending its way. Otherwise, the channel can get backed up while waiting for workers

[https://chat.openai.com/share/a575f592-6a2a-43b5-ab07-98df3ff746da](https://chat.openai.com/share/a575f592-6a2a-43b5-ab07-98df3ff746da)