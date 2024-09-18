---
created_at: "2024-02-29T09:46:31-08:00"
tags:
- go
- bug
title: a stupid bug
---

> func (f \*SQLiteFile) getTotalSize() (int64, error) {
>
> query :=
>
> ` SELECT COUNT(*), COALESCE(LENGTH(fragment), 0)`
>
> ` FROM file_fragments`
>
> ` WHERE file_id = (SELECT id FROM file_metadata WHERE path = ?)`
>
> ` ORDER BY fragment_index DESC`
>
> ` LIMIT 1`
>
> \`
>
> ` `
>
>  rows, err := f.db.Query(query, f.path)
>
> if err != nil {
>
> return 0, errors.Wrapf(err, "failed to query file: %s", f.path)
>
> }
>
> for [rows.Next](http://rows.Next)() {
>
> var count, lastFragmentSize int
>
>  err = rows.Scan(&count, &lastFragmentSize)
>
> if err != nil {
>
> return 0, err
>
> }
>
> totalSize := int64((count-1)\* _fragmentSize_ \+ lastFragmentSize)
>
> return totalSize, nil
>
>  }
>
> return 0, errors.Errorf("could not find file fragments for path: %s", f.path)
>
> }

This was the buggy code

> query :=
>
> `SELECT COUNT(*), COALESCE(LENGTH(fragment), 0)`
>
> `FROM file_fragments`
>
> `WHERE file_id = (SELECT id FROM file_metadata WHERE path = ?)`
>
> `ORDER BY fragment_index DESC`
>
> `LIMIT 1;`
>
> \`

the semi colon was causing the problem

the error was incredibly ineffective bad parameter or other API misuse: not an error (21)\\nfailed to query file: asdf.png\

chatgpt session [https://chat.openai.com/share/3d2b075f-55f3-4e5b-8b58-da65964da43b](https://chat.openai.com/share/3d2b075f-55f3-4e5b-8b58-da65964da43b) was somewhat helpful