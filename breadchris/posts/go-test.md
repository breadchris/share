---
created_at: "2024-02-23T14:06:13-08:00"
tags:
- go
- thinkies
title: go test
---

Testing in software development often finds itself at the tail end of the feature development cycle, sometimes viewed as a necessary evil to uphold code coverage metrics rather than an integral part of the development process. However, the significance of testing cannot be overstated—the safety net ensures our towering stack of dependencies doesn't collapse at the slightest touch.

A quick Google search on "<language> testing" unveils a fascinating landscape of testing frameworks across various programming languages. For instance, Java developers lean on JUnit for their testing needs, while Python aficionados favor unittest. JavaScript has Jest, C# has NUnit, Ruby has RSpec, PHP turns to PHPUnit, Swift relies on XCTest, Kotlin also uses JUnit, and Go developers have the convenience of the built-in testing package.

What stands out is that among these languages, Python and Go are unique in their approach to testing by including testing libraries within their standard libraries. This inclusion speaks volumes about the philosophy embedded in these languages—testing is not an afterthought but a fundamental development aspect.

This approach has profound implications. When the tools for testing are readily available, developers are more likely to integrate testing into their workflow from the get-go rather than treating it as a last-minute checkbox. The accessibility of these tools within the standard library means there's no excuse not to write tests. It's as if the language is nudging you to test your code, reinforcing that good testing practices are as crucial as writing the code itself.