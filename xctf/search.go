package xctf

/*

import (
"fmt"
"github.com/xctf-io/xctf/pkg/gen/chalgen"
)

type SearchState struct {
	SearchURL templ.SafeURL
	LoginURL templ.SafeURL
	Query string
	Results []string
}

templ Search(s SearchState, cs *Search) {
<div class="max-w-2xl py-32 sm:py-48 lg:py-56 space-y-4 mx-10 text-gray-400">
<h1 class="text-3xl">Security Search</h1>
<p>Only find exactly what you're looking for.</p>
@templ.Raw(fmt.Sprintf("<!-- %s -->", cs.Password))
<form action={s.SearchURL} method="get" class="flex flex-row space-x-2">
<label class="input input-bordered flex items-center gap-2">
<input type="text" name="query" class="grow" value={s.Query} placeholder="Search" />
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-4 h-4 opacity-70"><path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd" /></svg>
</label>
<input class="btn" type="submit" value="Search" />
</form>
<ul>
for _, result := range s.Results {
<li>{result}</li>
}
</ul>
</div>
}
*/
