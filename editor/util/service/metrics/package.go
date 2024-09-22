/*
Package metrics - Create a type for aggregating and propagating metrics to various services based on
configuration. Use it like this:

``` go
conf := metrics.NewConfig()
conf.Type = "http_server"

met, err := metrics.New(conf)

	if err != nil {
		panic(err)
	}

met.Incr("path.to.metric", 1)
```
*/
package metrics
