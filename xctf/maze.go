package xctf

/*
import (
"fmt"
"github.com/xctf-io/xctf/pkg/gen/chalgen"
)

type MazeState struct {
	QR func(string) string
	Solve templ.SafeURL
	SolvedPaths []string
}

templ Maze(state MazeState, maze *Maze) {
for _, s := range state.SolvedPaths {
<p>here is your soution: {s}</p>
}
<form method="POST" action={state.Solve} class="relative rounded-xl overflow-auto p-8">
<button type="submit" class="btn text-center">solve</button>
<div class={fmt.Sprintf("grid grid-cols-%d gap-4 font-mono text-white text-sm text-center font-bold leading-6 bg-stripes-fuchsia rounded-lg", maze.Columns)}>
for r := 0; r < int(maze.Rows); r++ {
for c := 0; c < int(maze.Columns); c++ {
<label class="p-4 rounded-lg shadow-lg bg-fuchsia-500">
{fmt.Sprintf("%d:%d", r, c)}
<img src={state.QR(fmt.Sprintf("%d:%d", r, c))} class="w-32 h-32" />
<input type="checkbox" name={fmt.Sprintf("%d:%d", r, c)} class="checkbox checkbox-info" />
</label>
}
}
</div>
</form>
}
*/
