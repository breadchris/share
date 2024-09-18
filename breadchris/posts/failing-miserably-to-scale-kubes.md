---
created_at: "2024-03-14T20:28:38-04:00"
tags:
- blog/post
- deploy
- kubes
title: failing miserably to scale kubes
---

I run a [cyber security competition](https://mcpshsf.com/) for high schoolers every year. Yesterday was the 7th iteration. Months of planning go into designing the story and putting together digital evidence for the competitors to try to solve a murder mystery. It was a special event because the organizers who built it for my high school self stoked my passion for security. Unfortunately, it did not go as planned this year. After giving the introduction talk to 350 students, the site got DOSed from the concurrent load of everyone accessing it. OK, easy fix: my app is deployed on Kubes; I'll increase the CPU and RAM of the pod. Error, unscheduable. Investigating why, I saw that I was using low-cost budget nodes, which were too small to support the requested resources.

![](https://assets.buttondown.email/images/7e480add-48c5-49d1-af62-dee2e0a4e096.png?w=960&fit=max)cheap, but very small

Most of what I know comes from the [book I read](https://www.amazon.com/Kubernetes-Action-Marko-Luksa/dp/1617293725), which was incredibly useful for getting started, and now I am being tested under pressure. If I had followed the book, I should have tried to balance the load by increasing the number of pods for my app. My heat-of-the-moment solution was to create a new node pool with bigger nodes. It was not wrong, but it was more involved. I needed to move the pods in the current node pool to the new one, but I made a mistake. Instead of [draining](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/) the node pool, I tried to delete it. It technically would have worked, but Postgres' volume claim prevented the node from being removed. I am now reminded of [the warnings](https://news.ycombinator.com/item?id=34999039) I have read about running a database in Kubes. As time passed, I got flustered and started on other deployment options.

![](https://assets.buttondown.email/images/5163e579-b9f1-474c-bb55-fa1519457935.png?w=960&fit=max)the message I missed: "pod has unbound immediate PersistentVolumeClaims"

My other solutions were a frantic rabbit hole, battling the strict requirements of the network students were using. I set up a Compute Engine VM quickly, but no HTTP. I needed a load balancer to get HTTPS, which was too confusing, so I used ngrok. ngrok's TLD is blocked, so I set up a custom domain. Finally, having it seemingly working, I realized my fatal flaw. My computer started to heat up as I remembered ngrok routes connections through your computer. The silly patchwork of infrastructure resulted in something that "kind of worked."

![](https://assets.buttondown.email/images/ef471670-daac-4de3-9014-cacd98e0f0cd.png?w=960&fit=max)trying to setup https in realtime is not easy

It pains me to write this and think through how simple the fix should have been. I had tunnel vision and failed to think clearly through the available options. The silver lining here is that I gave an engaging post-mortem presentation to the students at the end of the day. I wanted to demonstrate to students how to address failure, take ownership, and be transparent. It led to some pretty insightful questions being asked, which made me happy. I have the competition [still running](https://2024.mcpshsf.com/), with the scaling problems addressed, if you want to check it out. If you have questions about it or infra things, let me know; I would love to help ya out :)