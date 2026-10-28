# AI crawlers and robots.txt

`ai-search-readiness` reads `/robots.txt` and reports which of these user agents are blocked from the whole site (`Disallow: /`).

| User agent | Operator | What it does |
|---|---|---|
| `GPTBot` | OpenAI | Collects content that may be used to train OpenAI models |
| `OAI-SearchBot` | OpenAI | Indexes pages so they can appear in ChatGPT search results |
| `ChatGPT-User` | OpenAI | Fetches a page when a ChatGPT user or action asks for it |
| `ClaudeBot` | Anthropic | Collects content that may be used to train Claude models |
| `Claude-SearchBot` | Anthropic | Indexes pages to improve Claude's search results |
| `Claude-User` | Anthropic | Fetches a page when a Claude user asks for it |
| `PerplexityBot` | Perplexity | Indexes pages for Perplexity search answers |
| `Perplexity-User` | Perplexity | Fetches a page when a Perplexity user asks for it |
| `Google-Extended` | Google | A robots.txt token, not a separate crawler. Controls whether content crawled by Googlebot can be used for Gemini model training and grounding. It does not affect Google Search or AI Overviews |
| `Applebot-Extended` | Apple | A robots.txt token controlling whether Applebot-crawled content can train Apple's models |
| `Bingbot` | Microsoft | Crawls for Bing, which also feeds Microsoft Copilot answers |
| `CCBot` | Common Crawl | Builds the open Common Crawl dataset used by many AI projects |

Vendors add and rename agents from time to time. Check each operator's own documentation before you rely on this list.

## Search vs training

Blocking a training crawler (`GPTBot`, `ClaudeBot`, `Google-Extended`) is a content-licensing choice. Blocking a search or user agent (`OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `PerplexityBot`, `Bingbot`) can stop your pages being found or quoted in AI answers at all.

For a local business that wants enquiries, the usual setup is to allow the search and user agents and make a deliberate choice on the training ones.

## Example robots.txt

Allow AI search, opt out of model training:

```
User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: *
Allow: /

Sitemap: https://example.com.au/sitemap.xml
```

A group that names a crawler replaces the `*` group for that crawler, so a crawler with its own group ignores the rules under `User-agent: *`.

## A crawl is not a citation

Seeing `OAI-SearchBot` or `PerplexityBot` in your server logs shows a page was fetched. It does not show the page was cited in an answer, or that anyone clicked through. Smart Local explains how to tell crawls, citations and visits apart in your own logs: https://smart-local.com.au/resources/ai-crawl-vs-citation/
