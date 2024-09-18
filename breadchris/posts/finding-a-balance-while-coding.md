---
created_at: "2024-02-26T14:53:13-08:00"
tags:
- thinkies
- go
- ai
title: finding a balance while coding
---

When coding, have you ever stopped to ask the question: why am I doing this? Maybe it is a fleeting thought before you return to squeezing out a few more milliseconds on your page load.

As creators of software and websites, we often get caught up in the never-ending pursuit of optimization. We constantly strive to make our code more efficient, our algorithms faster, and our page load times shorter. But in our relentless quest for optimization, we may lose sight of the bigger picture.

Why are we optimizing? Is it to improve the user experience, to increase conversion rates, or to impress our peers? It's essential to pause and reflect on the reasons behind our optimization efforts. Are we optimizing for the right reasons, or are we just chasing after a fleeting sense of accomplishment?

Optimization is not inherently evil, but when it becomes our sole focus, we risk losing sight of the broader goals of our projects. We may sacrifice readability, maintainability, and even functionality by shaving off a few milliseconds. We must remember that optimization is just one piece of the puzzle and that there are other important considerations to consider.

Instead of blindly pursuing optimization at all costs, we should strive for balance. We should prioritize clear and maintainable code, robust functionality, and a positive user experience. While optimization is essential, it should not come at the expense of these other crucial aspects of our projects. What are examples of this as it relates to go?

In Go, a typical example of prioritizing balance over blind optimization is in the use of interfaces. While interfaces can add some overhead compared to concrete types, they can also provide significant benefits in code organization, flexibility, and testability. It is essential to weigh the trade-offs and choose the approach that best fits the project's specific needs, rather than simply focusing on optimizing for performance.

Another example is in the use of goroutines and channels for concurrency. While Go makes it easy to create lightweight concurrent processes, it is essential to carefully consider the design and architecture of the application to ensure that the code is maintainable and robust. Blindly optimizing for maximum concurrency without considering the complexity it adds to the codebase can lead to bugs and maintenance challenges down the line.

I don't often go for channels because what I need can be solved with loops. Now that Go has yield, you can avoid using channels even more. Just because something exists in a language doesn't mean you must use it.