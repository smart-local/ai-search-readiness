# ai-search-readiness (JavaScript)

Check a local business web page for Google and AI search readiness from Node.js or the command line. It covers on-page tags, JSON-LD schema, NAP consistency and AI crawler access in robots.txt.

The package has zero dependencies, is rule-based (no AI model, no API key) and is MIT licensed. It's built and maintained by [Smart Local](https://smart-local.com.au/), an Australian local SEO agency. It's the JavaScript port of the [AI Search Readiness](https://github.com/smart-local/ai-search-readiness) Python CLI.

## Install

```bash
npm install ai-search-readiness
# or run it without installing
npx ai-search-readiness https://example.com.au/
```

Requires Node.js 18 or later.

## CLI

```bash
ai-search-readiness https://example.com.au/                 # readable report
ai-search-readiness https://example.com.au/ --json          # JSON
ai-search-readiness https://example.com.au/ --min-score 80  # exit 1 if the score is below 80 (CI)
ai-search-readiness --html page.html --robots robots.txt    # check saved files
```

## API

```js
const { checkUrl, checkHtml } = require('ai-search-readiness');

const report = await checkUrl('https://example.com.au/');
console.log(report.score); // 0–100
for (const r of report.results) console.log(r.status, r.area, r.message);

// Already have the HTML, for example from a crawler or CMS hook?
const { score, results } = checkHtml(html, robotsTxt);
```

Each result is `{ area, status: 'pass' | 'warn' | 'fail', message }`. A pass counts 1, a warn 0.5 and a fail 0. TypeScript types are included.

## What it checks

| Area | Checks |
|---|---|
| On-page | title, meta description, single H1, canonical, `noindex`, `lang`, image alt text, Open Graph |
| Schema | JSON-LD parsing (including `@graph`), LocalBusiness properties, FAQPage |
| NAP | business name, phone and address in the page text vs the schema |
| AI crawlers | robots.txt rules for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot and more, plus a Sitemap line |

## Fixing results

- [AI visibility checklist](https://smart-local.com.au/resources/ai-visibility-checklist/)
- [AI crawling vs AI citation](https://smart-local.com.au/resources/ai-crawl-vs-citation/)
- [Local business schema](https://smart-local.com.au/resources/local-business-schema/)
- AI crawler reference data: [smart-local/ai-crawler-user-agents](https://huggingface.co/datasets/smart-local/ai-crawler-user-agents)

## Licence

MIT © [Smart Local](https://smart-local.com.au/) · 12 Clearview Drive, Glasshouse Mountains QLD 4518 · 1300 305 488
