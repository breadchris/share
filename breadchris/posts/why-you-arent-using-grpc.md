---
created_at: "2024-02-09T11:48:24-08:00"
tags:
- thinkies
- grpc
title: Why you aren't using gRPC
---

From the first moment I saw it, I thought that gRPC was going to change how people transferred data on the Internet. What are we using? Untyped JSON to REST endpoint? Obviously asking for problems. JSON schema? Better, but I don't want to write that crap. Also tooling is annoying. GraphQL? Pretty nice. Better than gRPC when dealing with many related objects, but again tooling is eh. gRPC is built on Protobuf, a simple type system that has been battle-hardened by Google and other large companies over the past 20 years. But you don't really see gRPC used outside of such large, mostly tech, companies. Why is that?

Well I think t

1\. Learning Curve: gRPC uses Protocol Buffers, a language-agnostic data serialization format, and requires developers to understand the concepts and protocols associated with it. The learning curve involved in understanding gRPC's concepts and usage patterns may deter some developers.

2\. Existing Infrastructure: Many organizations have established infrastructure and APIs built on traditional RESTful architectures, making it challenging to transition to gRPC without significant effort and changes to their existing systems.

3\. Compatibility: gRPC uses HTTP/2 as the underlying protocol, which is not supported by all network infrastructure and proxy servers. This lack of compatibility may limit the adoption of gRPC in certain environments.

4\. Language Support: While gRPC supports multiple programming languages, the ecosystem and community support may not be as extensive as that of more established technologies, such as RESTful APIs.

5\. Use Cases: gRPC is best suited for scenarios requiring high-performance, low-latency, and bidirectional streaming capabilities. It may not be the ideal choice for all types of applications and use cases, especially those that prioritize simplicity and convention over performance optimizations.

6\. Mindset and Familiarity: Developers, architects, and organizations often have established patterns, frameworks, and tools they are familiar with. The shift to gRPC may require a change in mindset and tooling, which can be a barrier to adoption.

7\. Documentation and Resources: The availability and quality of documentation, tutorials, and sample projects can play a crucial role in encouraging adoption. If the learning resources and community support for gRPC are limited, it may hinder widespread adoption.

If gRPC can already do bidirectional streaming I guess I don't understant why connect-es cant use that? Is it because of the whole http2 thing?

2m

yeah, that has been the fundamental probleme

http can keep a connection open to have server -> client streaming

1m

like, why not just use a websocket? just for the types?

1m

the connect project wanted to support as many devices as possible in the initial implementation

websockets wouldn't work in a lambda

http works in a lambda