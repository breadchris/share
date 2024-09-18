---
created_at: "2024-01-26T14:09:57-08:00"
tags:
- blog/post
title: I hacked your site.
---

It isn't your fault, you were just doing your job. Even if you wanted to try to stop it, there isn't much you, as an individual, could do about it. Either I or someone else who vaguely understands how to code was going to hack you like this. Business requirements for shipping that feature out at lighting speed for your largest customer last quarter made this all too easy.

\`\`\`js

const asdf = () => {}

\`\`\`

Your company's site uses javascript. It has a package.json that's filled with dependencies. It is probably fair to say you are using at least one of the top 1000 most popular javascript packages. Go ahead, find one that you use: select package -> package X

So let's take a look at package X. It has N lines of code and is maintained by M number of maintainers. But wait, there is more. What about the packages package X depends on? Well, it turns out there are D of them. And if you were to consider all of the maintainers of those packages, there are M' of them. Pretty wild.

Why would you care about this? Well let me lay out a scenario.

Let's say I am a hacker that wanted to hack your company. Knowing that your company's site uses package X, I can have some fun with your site. If it isn't obvious, package X's code and all of packages it depends on code all have \_full access\_ to your site. That means they could run whatever code they wanted to. Credit card number is entered into a form? Sounds juicy. Maybe I just want to show all your users some dancing cats. I'm sure they would love that. Let's go and do that.

Well, most of package X and its dependencies have their code hosted on Github and I have fabricated what looks to be a reputable account here. Look at me, such an outstanding open source contributor.

One of the packages that X depends on is package Y.

Package Y has N open issues for bug fixes or feature requests and I am sure they could use some help with some code. I'll spend a few hours to work on some code to resolve issue # and I'll send it over to package Y's maintainers. It might look like this.

Fortunately I made quick work of this issue because I had a helpful library lying around that did most of the work for me. I feel like my changes are pretty reasonable and it would be a no brainer for a maintainer to accept this code. Maybe there are a few tweaks to make, but odds are pretty good I can get that code landed.

Cool, so when my code gets landed, the maintainer will cut a new release at some point and my code will be running in your company's site once you bump your version or blow away your package lock like you normally do.

What are the odds the maintainer actually looked at that dependency I added? How often do you spend a single second looking at the package you are about to include into your app? If you are a good developer, I would give you a minute of looking at the docs, API, maybe the tests. But have you \_really\_ scanned through all the files? Did you check the \`scripts\` section of \`package.json\`? I sure as hell don't do this for every package I install, let alone all the other packages it installs. How can I when my manager is breathing down my neck?

Ok, ok, lets say you really are the engineer of the year and you poked and proded my PR and checked out the source code for the library I added. If you haven't go ahead and look, I'll wait. I would expect that your search hasn't actually turned up anything that could be considered "malware". Maybe you found a bug, but errornous lines don't really matter to me when I am stealing passwords from your users.

The malicious code isn't in the source code, it's in \_NPM\_. Before I release a version of my dependency to the npm registry, I tack on a little more javascript. You would only see this javascript if you were to directly download the dependency and open it up (link). Didn't see that one coming did ya? I made the JS obvious here, but what if it looked more like this: xxx Is that easier to read?

You might laugh at this attack vector, "wow great, you are going to land some code and then a year from now when we bump our package version you can hack our site". Well, the thing is I already have spent a year doing this to your site. I fingerprinted the dependencies that your site has from your source maps and script tags. I've been resolving issues like this for the past year, and you don't have the slightest idea which dependencies are actually trojan horses for my exploit code.

"Why would I ever accept your PR? It includes an unnecessary dependency! If I were that maintainer, I would tell you to write those lines yourself." Well, if you think that way, you obviously aren't a javascript developer. Micropackages are [encouraged](https://www.chevtek.io/why-i-think-micro-packages-are-a-good-thing/). That is how development is done in Javascript land. In fact, take a look at this graph showing how many packages Package X has included over time:

Most Stack Overflow answers to Javascript developers has at least one person suggesting to use a package to fix the problem. Maybe I will start suggesting my own packages as answers to questions...

Oh also, this isn't hypothetical, [it has already happened](https://snyk.io/blog/a-post-mortem-of-the-malicious-event-stream-backdoor/). Bitpay was targeted by this attack, and the hacker was only caught because he called a deprecated function that node printed a warning about. Knowing how they got caught, only make my malware stronger.

It doesn't take an experienced hacker or really anyone with any security experience to do this. In fact, a regular developer would probably be more equipped that me to execute this attack because they probably know those weird forgotten about packages better than me.

You know what, next time I hack your site, I am not going to wait around for some developer to accept my PR. I wonder how hard it would be to find a developer who is down on their luck and offer them a good amount of money, a hard earned wage, in exchange for them including my library in their project to help me "get my feet off the ground" as a fellow developer applying for jobs.

We know this attack is happening, and us at LunaSec are building the future of protection from this type of attack. We aren't waiting around for some security researcher to raise the next alarm and deal with the fire drill of responding to these incidents. No, we are automatically \_eradicating\_ this problem by using our knowledge as security researchers \_and\_ developers to design an intelligent, automated system that silently protects you and your company's code.