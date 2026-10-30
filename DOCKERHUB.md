# ai-search-readiness

Check a local business web page for Google and AI search readiness: on-page tags, JSON-LD schema, NAP consistency and AI crawler access in robots.txt.

The tool is open source (MIT), rule-based and uses no AI model or API key. It's built and maintained by **Smart Local**, an Australian local SEO agency: https://smart-local.com.au/

## Run it

```bash
docker run --rm smartlocalau/ai-search-readiness https://example.com.au/
```

To get JSON output, for CI or scripts:

```bash
docker run --rm smartlocalau/ai-search-readiness https://example.com.au/ --json
```

To check a saved HTML file:

```bash
docker run --rm -v "$PWD:/work:ro" smartlocalau/ai-search-readiness --html /work/page.html --base https://example.com.au/
```

## What it checks

| Area | Checks |
|---|---|
| On-page | title, meta description, H1, canonical, noindex, lang, image alt text, Open Graph |
| Schema | JSON-LD, LocalBusiness properties, FAQPage |
| NAP | name, phone and address in the visible text vs the schema |
| AI crawlers | robots.txt rules for GPTBot, ClaudeBot, PerplexityBot, Google-Extended and more, plus llms.txt |

## Image

- Base image: `python:3.12-alpine`, standard library only, runs as a non-root user
- Platforms: `linux/amd64`, `linux/arm64`
- Tags: `latest`, plus version tags such as `0.1.1`

## Links

- Source and docs: https://github.com/smart-local/ai-search-readiness
- Guide: [AI visibility checklist](https://smart-local.com.au/resources/ai-visibility-checklist/)
- Guide: [Local business schema](https://smart-local.com.au/resources/local-business-schema/)
- Smart Local: https://smart-local.com.au/ · 12 Clearview Drive, Glasshouse Mountains QLD 4518 · 1300 305 488
