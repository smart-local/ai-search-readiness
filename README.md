# AI Search Readiness

A small command-line checker that tells you whether a local business page is ready to be found and quoted by Google and by AI search tools such as ChatGPT search, Claude, Perplexity and Google AI Overviews.

Built and maintained by [Smart Local](https://smart-local.com.au/), a local digital marketing and AI search agency in Glasshouse Mountains, Queensland.

- Pure Python standard library (3.8+). No installs, no API keys.
- One file: `ai_search_readiness.py`.
- Plain-text report or JSON for spreadsheets and dashboards.

## What it checks

| Area | Check |
|---|---|
| Title, meta description, H1 | Present, sensible length, one H1 |
| Canonical, meta robots, `lang` | Canonical set, no accidental `noindex`, language declared |
| Images and Open Graph | Alt text coverage, `og:title` / `og:description` / `og:image` |
| Structured data | Parses every JSON-LD block (including `@graph`), lists types, flags invalid JSON |
| Business schema | Finds LocalBusiness-type markup and lists missing recommended properties (`geo`, `openingHoursSpecification`, `sameAs`, `areaServed`...) |
| NAP consistency | Checks the schema name, phone and street address also appear in the visible page text |
| AI crawlers | Reads `robots.txt` and reports whether GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot and others are blocked |
| Sitemap and llms.txt | Sitemap line in `robots.txt`, presence of `/llms.txt` |

## Usage

```bash
# Check a live page
python ai_search_readiness.py https://example.com.au/services/plumbing/

# Check a saved HTML file (for staging sites or pages behind a login)
python ai_search_readiness.py --html page.html --base https://example.com.au/

# JSON output
python ai_search_readiness.py https://example.com.au/ --json > report.json
```

Example output (from `tests/sample.html`):

```
AI search readiness: https://example.com.au/caloundra/
Score: 93/100

[PASS] Title             Title is 49 characters: Emergency Plumber Caloundra | Example Plumbing Co
[PASS] Meta description  Meta description is 134 characters.
[PASS] H1                One H1: Emergency Plumber in Caloundra
[WARN] Image alt text    1 of 2 images missing alt text.
[PASS] Structured data   JSON-LD types: FAQPage, Plumber
[WARN] Business schema   Plumber is missing: geo, openingHoursSpecification, image, logo, sameAs, areaServed, priceRange
[PASS] NAP: phone        Schema phone +61 7 5000 0000 appears on the page.
[PASS] NAP: address      Schema street address "1 Sample Street" appears in the visible text.
```

The score counts each pass as 1, each warning as 0.5 and each fail as 0. Use it to compare pages, not as a ranking prediction.

## Tests

```bash
python -m unittest discover -s tests -v
```

## Related

- [local-business-schema](https://github.com/smart-local/local-business-schema): JSON-LD templates for local businesses.

## About Smart Local

Smart Local helps local businesses from the Sunshine Coast to Brisbane get found in Google and AI search: SEO, Google Ads and web design.
Website: [smart-local.com.au](https://smart-local.com.au/) · 12 Clearview Drive, Glasshouse Mountains QLD 4518 · 1300 305 488

## Licence

MIT
