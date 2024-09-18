---
created_at: "2024-01-26T14:11:55-08:00"
tags:
- blog/post
title: We need LEGOs for Code
---

\## Playing with Legos

Legos are fun, they are [composable](https://en.wikipedia.org/wiki/Composability). Code is not composable, not at least in the way we learn to code.

Different environments come with different constraints which end up with different code. Different ecosystems have different standards and ways to solve a problem.

Legos have been designed to have an incredibly rigid specification that has been upheld for many years. It is trivial to determine impostor bricks (I am looking at you Mega Blocks) from an actual Lego. They look wrong, they \*feel\* wrong, they are just simple not as fun to play with.

When something is possible, someone is going to do it. If someone has done it, then someone might come along and decide to continue to do it in a similar way. All successful programming languages have a following of individuals who follow standards outlined by the language. Whether they are rigid semantic properties that will cause your code to fail to compile, or ideas around how to name variables, people replicate what they see in code.

AI has shown us just how deeply rooted these lines of thinking are. The more patterns that emerge in code, the easier it is for an AI to replicate these patterns. The "clever" developer comes up with hack after hack and more often than not writes code which they are only capable of comprehending. Since these are "clever" solutions which demonstrate a deep understanding of the tool being used, an AI might have a harder time arriving at the same solution.

But with Legos, it is quite difficult to bend the rules. \*Insert meme of stepping on lego\*. I mean, they are physically quite hard and not designed to bend. As a result, those who play with Legos are much more capable of seeing, reverse engineering, and repeating patterns they see when building sets or looking at other's builds. There are no secrets, there are rarely any surprises, just consistent creative thinking.

\## \[\](https://github.com/breadchris/notes/blob/001dbbef6dc23ce5349baf7b39e98536da9270f1/pages/We%20need%20Legos%20for%20Code.md#legos-as-code) Legos as Code

It makes sense why we don't have coding Legos, it is really hard to build. We are constantly pushing the boundary of what computers are capable of doing every day. AWS, GCP, Azure, and I haven't used it but AlibabaCloud, these are all \*\*massive\*\* collections of code that are at the point where you have to play Jeopardy with them to figure out how to do the simplest of things

>

"Chris, it is your board" "I will take '4 nines' for 100, please"

"'This service with a multi-character acronym made of a single letter is capable of holding a blob up to 5 TB in size and distributing it around the world."

With a Lego, you can always physically touch and see what a block is capable of doing. Short of showing up to a datacenter, I am not sure how I can physically interact with my data or code. I have to rely one documentation of features, trial and error to see what works or doesn't. It seems far too often I have to become an expert in an entire cloud technology before I actually reap the amazing benefits of it. All the while, I am probably burning cash in order to understand how the system works...

I teach high schoolers to code using [Scratch](https://scratch.mit.edu/). Scratch is a block based programming language where the blocks snap into each other. It is about as close to coding Legos as we can get, and my students love it. They come up with the most incredible programs, even those who would rather be still in bed at 8am in the morning. And where else do we see block based programming? Oh right, some of the largest video games in the world Minecraft and Roblox.

The thing is, we have written enough applications to know exactly [what is needed](https://supabase.com/) to take most ideas and scale them up to be legitimate businesses. Hell, Roblox is making \*bank\* off of children [building programs](https://www.roblox.com/create) in their ecosystem.

\## \[\](https://github.com/breadchris/notes/blob/001dbbef6dc23ce5349baf7b39e98536da9270f1/pages/We%20need%20Legos%20for%20Code.md#where-are-my-legos) Where are my Legos?

So what I am wondering is "Where are my Legos?".

You might be different than me, but it would be so cool if I could do the following and for it to "just work":

\- Open up my web browser and go to a coding site.

\- Write a single function that does something that I have done a thousand times (idk, some webscraper or something).

\- If my function depends on some other function, file storage, database, library, be able to easily connect that to my code in a way that I can use it (types, please for the love of god, I need types)

\- Send the function some data.

\- Call the function with some input data, verify my assumptions.

\- Click "deploy" and have the function be something that I can call remotely.

\- Configure the function to run on a schedule, when an event happens, etc.

\- If I like my code and I want to make it accessible for other people to start using, I want to formally define how to interact with my service by [defining a contract](https://grpc.io/).

All of this, by the way, could be made incredibly efficient to run too. With the dawn of [firecracker](https://firecracker-microvm.github.io/) serverless workflows can be spun up incredibly fast.

\## \[\](https://github.com/breadchris/notes/blob/001dbbef6dc23ce5349baf7b39e98536da9270f1/pages/We%20need%20Legos%20for%20Code.md#closing-remarks) Closing Remarks

We are in an age where so many problems that can be solved by code. CRUD apps that scale to thousands of users are trivial to write. The problem is the talent pipeline. Lessons being taught at bootcamps are not teaching sustainable programming. They aren't teaching people how to "code Legos". Companies that dictate bootcamp curriculum have tech stacks that are heavily dependent on code that has been written many years ago. Something as simple as writing untyped code spells disaster for any hope of writing code that could eventually be composable.

Anyways, I literally think about this every day and talk about it with friends in [my discord](https://discord.gg/QCVqvbpb) so if you are interested in learning more, please come and hang!