'use strict';
const { check, score, parseRobots, blocksRoot, AI_CRAWLERS } = require('./checker');
const pkg = require('../package.json');

const UA = `ai-search-readiness-js/${pkg.version} (+https://github.com/smart-local/ai-search-readiness)`;

async function get(url, timeoutMs) {
	const ctrl = new AbortController();
	const t = setTimeout(() => ctrl.abort(), timeoutMs);
	try {
		const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
		return { status: res.status, text: await res.text(), url: res.url };
	} finally { clearTimeout(t); }
}

/**
 * Fetch a page (and its robots.txt) and run every check.
 * @param {string} url
 * @param {{robots?: boolean, timeoutMs?: number}} [opts]
 */
async function checkUrl(url, opts = {}) {
	const { robots = true, timeoutMs = 15000 } = opts;
	const page = await get(url, timeoutMs);
	if (page.status >= 400) throw new Error(`HTTP ${page.status} for ${url}`);
	let robotsTxt;
	if (robots) {
		try {
			const r = await get(new URL('/robots.txt', page.url || url).href, timeoutMs);
			robotsTxt = r.status < 400 ? r.text : '';
		} catch { robotsTxt = ''; }
	}
	const results = check(page.text, robotsTxt);
	return { url: page.url || url, score: score(results), results };
}

/** Run every check on HTML you already have. Pass robots.txt text to include the AI crawler check. */
function checkHtml(html, robotsTxt) {
	const results = check(html, robotsTxt);
	return { score: score(results), results };
}

module.exports = { checkUrl, checkHtml, check, score, parseRobots, blocksRoot, AI_CRAWLERS };
