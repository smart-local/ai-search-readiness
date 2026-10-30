const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { checkHtml, checkUrl, AI_CRAWLERS } = require('../lib');

const html = fs.readFileSync(path.join(__dirname, 'sample.html'), 'utf8');
const robots = 'User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: https://example.com.au/sitemap.xml\n';

const r = checkHtml(html, robots);
assert.ok(r.score > 0 && r.score <= 100);
assert.strictEqual(r.results.find(x => x.area === 'Title').status, 'pass');
assert.strictEqual(r.results.find(x => x.area === 'AI crawlers').status, 'warn');
assert.ok(!checkHtml(html).results.some(x => x.area === 'AI crawlers'));
assert.ok(AI_CRAWLERS.includes('ClaudeBot'));

const bin = path.join(__dirname, '..', 'bin', 'ai-search-readiness.js');
const out = JSON.parse(execFileSync(process.execPath, [bin, '--html', path.join(__dirname, 'sample.html'), '--json']));
assert.strictEqual(typeof out.score, 'number');
let code = 0;
try { execFileSync(process.execPath, [bin, '--html', path.join(__dirname, 'sample.html'), '--min-score', '101'], { stdio: 'ignore' }); } catch (e) { code = e.status; }
assert.strictEqual(code, 1);

const srv = http.createServer((req, res) => res.end(req.url === '/robots.txt' ? robots : html)).listen(0, async () => {
	try {
		const rep = await checkUrl(`http://127.0.0.1:${srv.address().port}/`);
		assert.strictEqual(rep.score, r.score);
		console.log('all tests passed, sample score', rep.score);
	} catch (e) { console.error(e); process.exitCode = 1; } finally { srv.close(); }
});
