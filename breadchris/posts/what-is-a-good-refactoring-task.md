---
created_at: "2024-01-20T23:35:47Z"
tags:
- 100daystooffload
title: What is a good refactoring task?
---

There has been a [part of this code](https://github.com/lunabrain-ai/lunabrain/blob/54ddc68f80bf8d4a8978aa73f84f994b41bec410/js/site/form/ProtobufMessageForm.tsx) that I have been wanting to refactor for a while. Patch on patch of this form has left this code in disarray. This code is actually quite important to this site as well. It is a general application form that leverages the power of Protobuf's expressive type system to generate a form a user can interact with. I have some ideas for where I want to take this code, but they haven't been a priority. The form worked well enough, until it didn't.

I went to use the form today to try to enter in some information and I encountered a problem. If a map was referenced in the form, it would not save properly due to how the data was being serialized and sent:

\`\`\`

{ "key": "some key", "value": "some value" }

\`\`\`

should have been

\`\`\`

{ "some key": "some value" }

\`\`\`

Because of how this code was written, there was not a strong separation of concerns, which was a concern. Since this is a bug that is stopping a critical flow through this app, I had to resolve it. There were 2 options: tack on another patch or rewrite it sanely. When I code, I have shifted over the years to favor the former. When you can afford to write a patch, it is usually faster to implement and you can keep things moving. Just make sure you leave notes along the way, future you will thank you. Additionally, writing a patch doesn't stop you from rewriting. It is possible that by going through the exercise of adding the patch, you are able to load enough of the code into your head to more efficiently rewrite the code.

I started with attempting a patch. I am currently the sole developer of this codebase and so far patches to this form have been able to get me by. Reading through the code to track down the problem, I realized just how deep the problem is rooted. To patch on a solution would be more of a dirty, dirty hack to get it working. I didn't even bother thinking all the way through how I would have gotten it working because of how complicated it seemed. The stars had aligned to give this code a proper rewrite.

I rewrote this code to be as functional and generic as possible so that it could be reused for different purposes. It has been a while since I have as proud as I was to write this function. I felt myself tapping into some distant knowledge I had on functional ocaml as I wrote this. The solution was elegant and exactly what I needed. Opting for the rewrite was not free, it took time. The trade of time for this code was well worth taking and future me will be very grateful.