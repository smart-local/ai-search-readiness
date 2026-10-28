# Fixing your results

Each line in the report has an area, a status and a message. `PASS` scores 1, `WARN` scores 0.5 and `FAIL` scores 0. `INFO` lines are not scored.

Fix `FAIL` lines first, then `WARN` lines on your most important pages (home, main service pages, location pages).

## Title, meta description and H1

| Message | Fix |
|---|---|
| Missing `<title>` | Add one title per page: service + place + brand, for example `Emergency Plumber Caloundra \| Example Plumbing Co`. |
| Title is N characters (aim for 30-65) | Long titles get cut off in results. Short titles waste the space. Rewrite to fit. |
| Missing meta description | Write 70-160 characters that answer "what, where, how to contact". |
| No H1 / N H1s found | Use exactly one H1 that states what the page is about. |

## Canonical, indexing and language

- **No canonical link**: add `<link rel="canonical" href="...">` pointing to the preferred URL of the page.
- **Meta robots contains noindex**: the page has asked search engines not to index it. This is common on staging sites copied to live. Remove `noindex` unless you really want the page hidden.
- **No lang attribute**: add `lang="en-AU"` (or your locale) to the `<html>` tag.

## Images and Open Graph

- **Images missing alt text**: describe what the image shows in a few words. Decorative images can use `alt=""`, which the checker still counts as missing. Review those by hand.
- **Open Graph missing**: add `og:title`, `og:description` and `og:image` so links shared in chat apps and social posts show a proper preview.

## Structured data

| Message | Fix |
|---|---|
| No JSON-LD found | Add a `<script type="application/ld+json">` block describing the business. Templates: [local-business-schema](https://github.com/smart-local/local-business-schema). |
| Invalid JSON-LD | A comma, quote or bracket is wrong, so the whole block is ignored. Paste it into the Schema Markup Validator to find the error. |
| No LocalBusiness / Organization schema | Add a business node. Use the most specific type that fits (`Plumber`, `Electrician`, `ProfessionalService`...). |
| `<Type>` is missing: geo, openingHoursSpecification, ... | Add the listed properties with real values only. Leave out anything you can't back up. |

Smart Local's guide to which schema a local service business needs, how to use `@id`, and how to test it: https://smart-local.com.au/resources/local-business-schema/

## NAP consistency

The checker compares the business name, phone and street address in your schema with the visible text on the page.

- **Phone does not appear on the page**: show the same number in the page text or a `tel:` link. Formatting can differ (`1300 305 488` and `+611300305488` match).
- **Street address does not appear**: show the address as written in the schema, or fix the schema to match what the page shows.
- **Business name does not appear**: use the same trading name in the schema, the page and your Google Business Profile.

Service-area businesses that hide their address on Google should leave `streetAddress` out of the schema too, rather than show one address in one place and none in another.

## AI crawlers, sitemap and llms.txt

- **robots.txt blocks: ...**: the listed crawlers are refused at `/`. See [AI crawlers and robots.txt](ai-crawlers.md) before you change anything. Some of these tokens control model training only, not search.
- **No Sitemap line in robots.txt**: add `Sitemap: https://example.com.au/sitemap.xml`.
- **No llms.txt**: optional. Nothing requires it, and no major search engine has said it uses it for ranking. Add one if you want a short, curated map of your key pages for AI tools.
