# JSON output

Run with `--json` to get a machine-readable report:

```bash
python ai_search_readiness.py https://example.com.au/ --json > report.json
```

```json
{
  "url": "https://example.com.au/caloundra/",
  "score": 93,
  "results": [
    {"area": "Title", "status": "pass", "message": "Title is 49 characters: Emergency Plumber Caloundra | Example Plumbing Co"},
    {"area": "Image alt text", "status": "warn", "message": "1 of 2 images missing alt text."}
  ]
}
```

| Field | Type | Meaning |
|---|---|---|
| `url` | string | The page checked (or the `--base` URL when using `--html`) |
| `score` | integer 0-100 | Passes count 1, warnings 0.5, fails 0. `info` lines are not counted |
| `results[].area` | string | Check name, for example `Title`, `NAP: phone`, `AI crawlers` |
| `results[].status` | string | `pass`, `warn`, `fail` or `info` |
| `results[].message` | string | Plain-English detail |

## Checking many pages

```bash
while read -r url; do
  python ai_search_readiness.py "$url" --json | jq -c .
done < urls.txt > reports.jsonl
```

Each line of `reports.jsonl` is one page's report. `jq -c .` turns the pretty-printed JSON into a single line per page.
