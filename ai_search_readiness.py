#!/usr/bin/env python3
"""ai-search-readiness: check a local business web page for Google and AI search readiness.

Standard library only (Python 3.8+). Maintained by Smart Local - https://smart-local.com.au/

Usage:
    python ai_search_readiness.py https://example.com.au/
    python ai_search_readiness.py --html saved-page.html --base https://example.com.au/
    python ai_search_readiness.py https://example.com.au/ --json
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

__version__ = "0.1.1"
UA = "ai-search-readiness/%s (+https://github.com/smart-local/ai-search-readiness)" % __version__

# Crawlers used by AI search and answer engines, grouped by vendor.
AI_CRAWLERS = [
    "GPTBot", "OAI-SearchBot", "ChatGPT-User",
    "ClaudeBot", "Claude-SearchBot", "Claude-User",
    "PerplexityBot", "Perplexity-User",
    "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot",
]

LOCAL_TYPES = {
    "LocalBusiness", "ProfessionalService", "HomeAndConstructionBusiness", "Plumber",
    "Electrician", "RoofingContractor", "HVACBusiness", "Locksmith", "GeneralContractor",
    "HousePainter", "MovingCompany", "PestControl", "AutoRepair", "Dentist", "MedicalClinic",
    "LegalService", "Attorney", "AccountingService", "FinancialService", "InsuranceAgency",
    "RealEstateAgent", "Restaurant", "Store", "HealthAndBeautyBusiness", "CleaningService",
    "LodgingBusiness", "AutomotiveBusiness", "EmergencyService", "Organization",
}
LOCAL_RECOMMENDED = ["name", "url", "telephone", "address", "geo", "openingHoursSpecification",
                     "image", "logo", "sameAs", "areaServed", "priceRange"]


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.meta = {}
        self.links = []
        self.h1 = []
        self.jsonld = []
        self.imgs = []
        self.tel_links = []
        self.text = []
        self.lang = ""
        self._stack = []
        self._buf = None

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        if tag == "html":
            self.lang = a.get("lang", "")
        elif tag == "meta":
            key = (a.get("name") or a.get("property") or "").lower()
            if key:
                self.meta[key] = a.get("content", "")
        elif tag == "link":
            self.links.append(a)
        elif tag == "img":
            self.imgs.append(a)
        elif tag == "a" and a.get("href", "").lower().startswith("tel:"):
            self.tel_links.append(a["href"][4:])
        if tag in ("title", "h1") or (tag == "script" and a.get("type", "").lower() == "application/ld+json"):
            self._stack.append(tag)
            self._buf = []
        elif tag in ("script", "style"):
            self._stack.append("skip")

    def handle_endtag(self, tag):
        if not self._stack:
            return
        top = self._stack[-1]
        if top == "skip" and tag in ("script", "style"):
            self._stack.pop()
            return
        if top == tag:
            self._stack.pop()
            content = "".join(self._buf or []).strip()
            self._buf = None
            if tag == "title":
                self.title = re.sub(r"\s+", " ", content)
            elif tag == "h1":
                self.h1.append(re.sub(r"\s+", " ", content))
            elif tag == "script":
                self.jsonld.append(content)

    def handle_data(self, data):
        if self._buf is not None:
            self._buf.append(data)
        elif not self._stack:
            self.text.append(data)


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read(5_000_000)
            charset = r.headers.get_content_charset() or "utf-8"
            return r.status, body.decode(charset, "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # network errors
        return None, str(e)


def flatten_jsonld(blocks):
    nodes, errors = [], []
    for raw in blocks:
        try:
            data = json.loads(raw)
        except ValueError as e:
            errors.append("Invalid JSON-LD: %s" % e)
            continue
        stack = data if isinstance(data, list) else [data]
        while stack:
            item = stack.pop()
            if isinstance(item, dict):
                if "@graph" in item:
                    stack.extend(item["@graph"] if isinstance(item["@graph"], list) else [item["@graph"]])
                if "@type" in item:
                    nodes.append(item)
            elif isinstance(item, list):
                stack.extend(item)
    return nodes, errors


def types_of(node):
    t = node.get("@type", [])
    return set(t if isinstance(t, list) else [t])


def digits(s):
    """Digits only, with the +61 country code and trunk 0 removed (AU numbers)."""
    d = re.sub(r"\D", "", s or "")
    if d.startswith("61"):
        d = d[2:]
    return d.lstrip("0")


def parse_robots(text):
    """Return {agent_lower: [(directive, path), ...]}."""
    groups, agents, last_was_agent = {}, [], False
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if ":" not in line:
            continue
        key, val = [x.strip() for x in line.split(":", 1)]
        key = key.lower()
        if key == "user-agent":
            if not last_was_agent:
                agents = []
            agents.append(val.lower())
            groups.setdefault(val.lower(), [])
            last_was_agent = True
        elif key in ("allow", "disallow"):
            for ag in agents:
                groups[ag].append((key, val))
            last_was_agent = False
        else:
            last_was_agent = False
    return groups


def robots_blocks_root(groups, agent):
    rules = groups.get(agent.lower())
    if rules is None:
        rules = groups.get("*", [])
    allows = [p for d, p in rules if d == "allow" and p in ("/", "")]
    blocks = [p for d, p in rules if d == "disallow" and p == "/"]
    return bool(blocks) and not any(p == "/" for p in allows)


def check(html, url, fetch_site=True):
    p = PageParser()
    p.feed(html)
    res = []

    def add(area, status, msg):
        res.append({"area": area, "status": status, "message": msg})

    # On-page basics
    t = p.title
    if not t:
        add("Title", "fail", "Missing <title>.")
    elif not 30 <= len(t) <= 65:
        add("Title", "warn", "Title is %d characters (aim for 30-65): %s" % (len(t), t))
    else:
        add("Title", "pass", "Title is %d characters: %s" % (len(t), t))
    d = p.meta.get("description", "")
    if not d:
        add("Meta description", "fail", "Missing meta description.")
    elif not 70 <= len(d) <= 160:
        add("Meta description", "warn", "Meta description is %d characters (aim for 70-160)." % len(d))
    else:
        add("Meta description", "pass", "Meta description is %d characters." % len(d))
    if len(p.h1) == 1:
        add("H1", "pass", "One H1: %s" % p.h1[0])
    elif not p.h1:
        add("H1", "fail", "No H1 found.")
    else:
        add("H1", "warn", "%d H1s found. Use one." % len(p.h1))
    canon = [l.get("href") for l in p.links if "canonical" in l.get("rel", "").lower().split()]
    add("Canonical", "pass" if canon else "warn", "Canonical: %s" % canon[0] if canon else "No canonical link.")
    robots_meta = p.meta.get("robots", "").lower()
    if "noindex" in robots_meta:
        add("Indexing", "fail", "Meta robots contains noindex.")
    else:
        add("Indexing", "pass", "No noindex in meta robots.")
    if not p.lang:
        add("Language", "warn", "No lang attribute on <html>.")
    else:
        add("Language", "pass", "lang=\"%s\"" % p.lang)
    no_alt = [i.get("src", "") for i in p.imgs if not i.get("alt", "").strip()]
    if p.imgs:
        add("Image alt text", "warn" if no_alt else "pass",
            "%d of %d images missing alt text." % (len(no_alt), len(p.imgs)) if no_alt
            else "All %d images have alt text." % len(p.imgs))
    og = [k for k in ("og:title", "og:description", "og:image") if not p.meta.get(k)]
    add("Open Graph", "warn" if og else "pass", "Missing: %s" % ", ".join(og) if og else "og:title, og:description and og:image set.")

    # Structured data
    nodes, errs = flatten_jsonld(p.jsonld)
    for e in errs:
        add("Structured data", "fail", e)
    found = sorted({t for n in nodes for t in types_of(n)})
    add("Structured data", "pass" if nodes else "fail",
        "JSON-LD types: %s" % ", ".join(found) if nodes else "No JSON-LD found.")
    biz = [n for n in nodes if types_of(n) & LOCAL_TYPES and n.get("address")] or \
          [n for n in nodes if types_of(n) & LOCAL_TYPES]
    if biz:
        b = biz[0]
        missing = [k for k in LOCAL_RECOMMENDED if not b.get(k)]
        add("Business schema", "warn" if missing else "pass",
            "%s is missing: %s" % ("/".join(sorted(types_of(b))), ", ".join(missing)) if missing
            else "%s has all recommended properties." % "/".join(sorted(types_of(b))))
        # NAP consistency between schema and visible page
        page_text = " ".join(p.text)
        page_digits = digits(page_text) + " " + " ".join(digits(x) for x in p.tel_links)
        tel = digits(b.get("telephone", ""))
        if tel:
            add("NAP: phone", "pass" if tel in page_digits else "warn",
                "Schema phone %s %s on the page." % (b.get("telephone"), "appears" if tel in page_digits else "does not appear"))
        addr = b.get("address") or {}
        street = addr.get("streetAddress", "") if isinstance(addr, dict) else str(addr)
        if street:
            ok = re.sub(r"\s+", " ", street.lower()) in re.sub(r"\s+", " ", page_text.lower())
            add("NAP: address", "pass" if ok else "warn",
                "Schema street address \"%s\" %s in the visible text." % (street, "appears" if ok else "does not appear"))
        name = b.get("name", "")
        if name:
            ok = name.lower() in page_text.lower() or name.lower() in t.lower()
            add("NAP: name", "pass" if ok else "warn", "Business name \"%s\" %s on the page." % (name, "appears" if ok else "does not appear"))
    else:
        add("Business schema", "fail", "No LocalBusiness / Organization schema found.")
    if any("FAQPage" in types_of(n) for n in nodes):
        add("FAQ schema", "pass", "FAQPage markup found (check every Q&A is visible on the page).")

    # Site-level files
    if fetch_site and url:
        root = "{0.scheme}://{0.netloc}".format(urllib.parse.urlparse(url))
        code, robots = fetch(root + "/robots.txt")
        if code == 200:
            groups = parse_robots(robots)
            blocked = [a for a in AI_CRAWLERS if robots_blocks_root(groups, a)]
            add("AI crawlers", "warn" if blocked else "pass",
                "robots.txt blocks: %s" % ", ".join(blocked) if blocked else "robots.txt allows all %d AI crawlers checked." % len(AI_CRAWLERS))
            sm = re.findall(r"(?im)^\s*sitemap:\s*(\S+)", robots)
            add("Sitemap", "pass" if sm else "warn", "Sitemap in robots.txt: %s" % sm[0] if sm else "No Sitemap line in robots.txt.")
        else:
            add("AI crawlers", "warn", "robots.txt not found (HTTP %s)." % code)
        code, llms = fetch(root + "/llms.txt")
        ok = code == 200 and llms.lstrip().startswith("#")
        add("llms.txt", "pass" if ok else "info",
            "llms.txt found." if ok else "No llms.txt (optional; some AI tools read it).")
    return res


def score(results):
    pts = {"pass": 1.0, "warn": 0.5, "fail": 0.0}
    scored = [r for r in results if r["status"] in pts]
    return round(100 * sum(pts[r["status"]] for r in scored) / len(scored)) if scored else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description="Check a local business page for Google and AI search readiness.")
    ap.add_argument("url", nargs="?", help="Page URL to check")
    ap.add_argument("--html", help="Check a saved HTML file instead of fetching the URL")
    ap.add_argument("--base", help="Site URL used for robots.txt / llms.txt checks with --html")
    ap.add_argument("--no-site", action="store_true", help="Skip robots.txt and llms.txt checks")
    ap.add_argument("--json", action="store_true", help="Print results as JSON")
    ap.add_argument("--version", action="version", version=__version__)
    a = ap.parse_args(argv)
    if not a.url and not a.html:
        ap.error("give a URL or --html FILE")
    if a.html:
        with open(a.html, encoding="utf-8", errors="replace") as f:
            html = f.read()
        url = a.base or a.url
    else:
        code, html = fetch(a.url)
        if code != 200:
            print("Could not fetch %s (HTTP %s)" % (a.url, code), file=sys.stderr)
            return 2
        url = a.url
    results = check(html, url, fetch_site=not a.no_site and bool(url))
    s = score(results)
    if a.json:
        print(json.dumps({"url": url, "score": s, "results": results}, indent=2))
    else:
        icons = {"pass": "PASS", "warn": "WARN", "fail": "FAIL", "info": "INFO"}
        print("AI search readiness: %s\nScore: %d/100\n" % (url or a.html, s))
        for r in results:
            print("[%s] %-17s %s" % (icons[r["status"]], r["area"], r["message"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
