package metrics

import "testing"

func TestInterfaces(t *testing.T) {
	foo, err := New(NewConfig())
	if err != nil {
		t.Error(err)
	}
	bar := Type(foo)
	foo.Incr("nope", 1)
	bar.Incr("nope", 1)
}
