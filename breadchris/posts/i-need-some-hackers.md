---
created_at: "2024-02-21T23:14:38-08:00"
tags:
- xctf
- blog/post
title: i need some hackers
---

TL;DR - I need money for a non-profit international cybersecurity competition (open-source, too). Donations [here](https://hcb.hackclub.com/donations/start/mcps-hsf), email [chris@breadchris.com](mailto:chris@breadchris.com) for sponsorship opportunities.

I am running an [annual cyber security competition](https://mcpshsf.com/) (mcpshsf, soon to be xctf) with my high school computer science teacher, celebrating its 8th? year, on March 14th. When [run at NYU](https://breadchris.com/blog/nyu-dropped-the-ball/), it attracted incredible talent from around the US. Some of the alumni went on to form or join notable security companies/teams ( [TrailofBits](https://www.trailofbits.com/), [Zellic](https://www.zellic.io/), Google, Uber, etc.). Over 400 students at the Montgomery County Community College in Maryland will compete against each other in an NCIS-style cyber forensics murder mystery (like CLUE, but on the Internet).

The security talent pipeline relies heavily on CTF competitions to develop talent, as the school curriculum for providing proper "hacking skills" is lacking. The biggest cyber security competition for high schools is [CyberPatriot,](https://www.uscyberpatriot.org/Pages/About/What-is-CyberPatriot.aspx) which Northrop Grumman puts on, and it could be a lot better (the loading time for the page should show you how much they care). It teaches some fundamental IT security skills, but the skill cap is far too low for those who want more. CTF is unique because it blends technical problem-solving with deductive reasoning; you are solving a murder, after all. For example, successful teams have members who not only have knowledge of how to recover images from a hard drive but also the skills to place them on a timeline to invalidate a character's alibi. Industry professionals (DHS, CIA, FBI, etc.) help assess how well the conclusions hold up in court, emulating as closely as possible how a real investigation would work.

To fully realize this competition, I need to bring on my high school computer teacher part-time ($25,000). Teachers do not make enough, let alone have the time to make this happen otherwise. The infrastructure needs to scale up ($40/student a month based on the competition data, can drive this down). I need sponsors but some help getting started with that (time/knowledge). If this is something you are interested in/have experience with, please contact me at [chris@breadchris.com](mailto:chris@breadchris.com). We are a registered non-profit and would appreciate [donations](https://hcb.hackclub.com/donations/start/mcps-hsf).

![](https://mcpshsf.com/images/hsf-people.png)

xctf is also an [open-source platform](https://github.com/xctf-io/xctf) we have developed. High school students do most of the work at this point. Story development and challenge creation. I am mainly there to facilitate the deployment, which costs money. It runs in GCP with Kubernetes, and the costs are relatively low.

![](https://i.imgur.com/dAnXajg.png)Billing is usually $60 a month

During the competition, competitors only have access to Chromebooks. Tools for hacking do not run on a Chromebook, so a cloud computer is [provided to them](https://github.com/xctf-io/chalgen/blob/master/competition_infra/shell/shell.py).

![](https://i.imgur.com/J80NjAg.png)every 4 hours of full deployment is $20

Recently, xctf was presented to educators from around the US at the [NICE K12 Cybersecurity Education Conference](https://arc.net/l/quote/qecviglm). This has been our first push toward getting the buy-in from the education system outside the neighboring school counties. The dream is to expand this competition throughout the US so that any college can run this for themselves. Making more opportunities for students predisposed to the ["hacker" mindset](https://breadchris.com/blog/i-hacked-my-high-school-and-you-should-too/) is essential for developing valuable life skills and mental health. The community building that this competition brings is incredible. Competitors become builders and lifelong friends. I am currently roommates with someone who competed in this competition.

I just want to see some high schoolers hack some shit without getting in trouble for it. Lmk if you want to help a fellow hacker out.

You can try it yourself (writeup [here](https://justluk.dev/posts/writeups/mcpshsf/)); every high schooler starts with the instructions:

From the challenge document, we are given the username

`` `sadamana` ``, the password `` `s4d4m4n4` ``, and URL **[https://twitter-flask.chals.mcpshsf.com/](https://twitter-flask.chals.mcpshsf.com/)**