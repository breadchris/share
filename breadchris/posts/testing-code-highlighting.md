---
created_at: "2024-02-08T15:40:10-08:00"
tags:
- thinkies
title: Testing Code Highlighting
---

```go
package main

import "fmt"

// Function to calculate factorial
func factorial(n int) int {
    // Base case: factorial of 0 and 1 is 1
    if n == 0 || n == 1 {
        return 1
    }

    // Recursive case: calculate factorial using recursion
    return n * factorial(n-1)
}

func main() {
    // Example usage
    num := 5
    result := factorial(num)
    fmt.Printf("Factorial of %d is %d\n", num, result)
}
```

![](https://i.imgur.com/FsCIua1.jpeg)

oh look it works. this was something that was so simple, yet missing from Substack.