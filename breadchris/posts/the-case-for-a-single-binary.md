---
created_at: "2024-03-11T14:10:20-04:00"
tags:
- go
- thinkies
title: The case for a single binary
---

In the realm of software development, the dichotomy between local development environments and production settings presents a notable challenge. The ideal scenario is where both environments mirror each other as closely as possible, minimizing discrepancies that can lead to unexpected behaviors upon deployment. However, achieving this level of synchronization is fraught with complexities. Tools like Docker have emerged as potential solutions, offering the promise of containerization to encapsulate applications in self-contained units that can run consistently across various environments. Yet, this approach is not without its pitfalls, often introducing additional layers of complexity and overhead.

A pragmatic approach to alleviating some of these challenges is to advocate for the consolidation of as much code as possible into a single, statically compiled executable. This methodology not only streamlines the deployment process by reducing the number of moving parts but also enhances the speed of development iteration. The ability to make changes and see their immediate impact without the overhead of managing external dependencies or services can significantly accelerate the development cycle.

This philosophy aligns with the principles behind the design of languages like Go, as articulated by one of its creators, Rob Pike. Go treats the use of cgo, which allows Go packages to call C code, with caution. The rationale is rooted in the desire to maintain the simplicity and reliability of statically linked binaries. By minimizing reliance on external shared libraries, Go aims to preserve the portability and ease of deployment that comes with static compilation. This design choice reflects a broader preference for interfaces and contracts over intricate implementation details, focusing on how components interact rather than how they are internally constructed.

The contrast becomes stark when considering the experience of Python developers, particularly when dealing with libraries that depend on external shared objects. The dynamic nature of Python and its ecosystem, while offering flexibility and ease of use, can lead to frustration when external dependencies are not perfectly aligned across development and production environments. Issues such as incompatible library versions or missing shared libraries can derail development efforts. In contrast, a pure Python library, while theoretically more portable, faces performance trade-offs and the practical challenges of replicating functionalities typically handled more efficiently by lower-level languages.

pain with crypto [https://pypi.org/project/cryptography/](https://pypi.org/project/cryptography/) or [https://github.com/wbond/oscrypto](https://github.com/wbond/oscrypto) or tink

The challenges of maintaining parity between local development and production environments underscore the importance of simplifying development processes where possible. Emphasizing compact, self-contained code and reducing external dependencies can mitigate some of the inherent complexities of software development. This approach encourages developers to focus on the essential interactions between their code and the system, fostering a more efficient and less error-prone development lifecycle.