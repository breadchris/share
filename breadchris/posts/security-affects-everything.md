---
created_at: "2024-03-24T23:48:10-07:00"
tags:
- ai
- blog/post
title: security affects everything
---

As a security engineer, I found [this talk](https://www.youtube.com/watch?v=RWx_DitGF7A) interesting. It pushes for something that I agree with: the focus of ML security in research papers is primarily on novel adversarial attacks, but there are an incredible number of attacks on the supply chain aspect of training models that are often overlooked. The attacks from the papers are relevant but might require varying levels of attacker access to the system (ex., needing to observe model weights or inference confidence isn't always immediately accessible to an attacker). Models trained off of public datasets or models are at risk of several attacks from the papers as the model weights of the base model are more known, and adversarial attacks can be performed offline.

From my perspective, ML pipelines are pretty terrifying in application security. Trained models are shared around as pickled Python classes, a file format that can [execute code](https://blog.trailofbits.com/2021/03/15/never-a-dill-moment-exploiting-machine-learning-pickle-files/) when loaded in another process. Over the past 4 years, I have been researching open-source dependencies, and I am concerned about the amount of [malware](https://blog.phylum.io/q3-2023-evolution-of-software-supply-chain-security-report/) in the Pypi registry. ML is built on packages like pytorch, which have already been [targeted](https://www.theregister.com/2023/01/04/pypi_pytorch_dependency_attack/). Since the ML pipeline spans many languages, vulnerabilities in other languages also apply. [Log4Shell](https://www.lunasec.io/docs/blog/log4j-zero-day/) affected a ubiquitous Java logging library with a perfect 10 severity. An ML pipeline consists of many parts, and influencing or obtaining the model is of high value for an attacker.

Controlling an AI's reasoning is a powerful capability. We are on the cusp of a wide distribution of ML models, with very little preparedness to prevent vulnerabilities in core components of the pipeline and distribution. It is important to note that models are like reprogrammable programs. We are improving our ability to [reverse engineer](https://www.anthropic.com/news/decomposing-language-models-into-understandable-components) them. Identifying and triggering "code paths" that result in attacker-controlled behavior is a security vulnerability.

With more ML decisions being made in critical systems. It is imperative to have a holistic view of security as it relates to ML. A model's reliability is only as reliable as the data and training that builds it. And if you can't trust them, then ur hacked.