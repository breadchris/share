package html

func Filter[TC any, Slice ~[]TC](collection Slice, predicate func(item TC, index int) bool) Slice {
	result := make(Slice, 0, len(collection))

	for i := range collection {
		if predicate(collection[i], i) {
			result = append(result, collection[i])
		}
	}

	return result
}

func Keys[K comparable, V any](in map[K]V) []K {
	result := make([]K, 0, len(in))

	for k := range in {
		result = append(result, k)
	}

	return result
}

func Contains[TC comparable](collection []TC, element TC) bool {
	for i := range collection {
		if collection[i] == element {
			return true
		}
	}

	return false
}
