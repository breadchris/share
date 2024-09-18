---
created_at: "2024-01-25T23:36:04Z"
tags:
- 100daystooffload
title: Workflow Engine syntax isn't making me happy, halp
---

I have been building a workflow engine that can route strongly-typed data through durable functions (guaranteed to execute). These functions do not need to exist in the process, they could be remote APIs, [grpc](https://grpc.io/) servers, a p2p connection with your friend's computer. It supports streaming of data with observables, thanks to [rxgo](https://github.com/ReactiveX/RxGo), meaning you can create rules to map, filter, reduce data without redeployment.

This is the sketch I have in my head, and have been trying to implement it [here](https://github.com/protoflow-labs/protoflow/tree/main). Something that I am trying to nail is the syntax for how to express these workflows. You can take a look at what I have so far in a [simple test](https://github.com/protoflow-labs/protoflow/blob/main/pkg/workflow/workflow_test.go#L14) I wrote (\[graph\]( [https://mermaid.live/edit#pako:eNp10D1rwzAQBuC\\\_ctycDHY3D51KoVDaUo9WBmEdiSj64HRKCUn-e2VZpkurQRLvI8HLXXEOhnDAI-t4gtdP5aEsnkbiM\\\_EAQkmgO6yx76bn7GexwcNb-de437j\\\_kx8aWx-zTC\\\_LDqMwadcgZFnkvR7wwWGmlKw\\\_Fm51YL9\\\_vEUOZ2so3UqPf\\\_J-61nB6ZhAwm9eG1T6tkzNuq18BXJWVlhb4Q4dsdPWlCFdl6cK5USOFA7lajR\\\_KVT-Xt7pLGG8-BkH4Uw7zNFooSery2zdGt5\\\_AMgGeW0](https://mermaid.live/edit#pako:eNp10D1rwzAQBuC_ctycDHY3D51KoVDaUo9WBmEdiSj64HRKCUn-e2VZpkurQRLvI8HLXXEOhnDAI-t4gtdP5aEsnkbiM_EAQkmgO6yx76bn7GexwcNb-de437j_kx8aWx-zTC_LDqMwadcgZFnkvR7wwWGmlKw_Fm51YL9_vEUOZ2so3UqPf_J-61nB6ZhAwm9eG1T6tkzNuq18BXJWVlhb4Q4dsdPWlCFdl6cK5USOFA7lajR_KVT-Xt7pLGG8-BkH4Uw7zNFooSery2zdGt5_AMgGeW0)) of what is going on).

I could use some people's eyes and brain to help me work through how to make this feel better to code. Thanks!