# share
you know what makes me annoyed. when I can't share something easily. i am going to change that.

## hack

### build wasm
```bash
GOOS=js GOARCH=wasm go build -buildvcs=false -ldflags "-s -w" -o editor/web/public/wasm/analyzer@v1.wasm ./editor/wasm/analyzer/webworker.go
```

run the code yourself.

```bash
git clone https://github.com/breadchris/share.git
cd share
go run . start
```

create a [digital ocean](https://www.digitalocean.com/) droplet and run the code there.
I want to make hosting easier, so if you have an idea, create an issue.
```

[github](github.com/breadchris/share)
[twitter](twitter.com/breadchris)
