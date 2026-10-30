'use strict';
/* Dependency-free AI search readiness checks. Port of github.com/smart-local/ai-search-readiness (MIT). */

const AI_CRAWLERS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
	'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];
const LOCAL_TYPES = new Set(['LocalBusiness', 'ProfessionalService', 'HomeAndConstructionBusiness', 'Plumber', 'Electrician',
	'RoofingContractor', 'HVACBusiness', 'Locksmith', 'GeneralContractor', 'HousePainter', 'MovingCompany', 'PestControl',
	'AutoRepair', 'Dentist', 'MedicalClinic', 'LegalService', 'Attorney', 'AccountingService', 'FinancialService',
	'InsuranceAgency', 'RealEstateAgent', 'Restaurant', 'Store', 'HealthAndBeautyBusiness', 'CleaningService',
	'LodgingBusiness', 'AutomotiveBusiness', 'EmergencyService', 'Organization']);
const RECOMMENDED = ['name', 'url', 'telephone', 'address', 'geo', 'openingHoursSpecification', 'image', 'logo', 'sameAs', 'areaServed', 'priceRange'];

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decode(s) {
	return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
		if (e[0] === '#') return String.fromCharCode(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
		return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : m;
	});
}
function clean(s) { return decode(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function attrs(tag) {
	const out = {};
	const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	let m; const body = tag.replace(/^<\s*[a-zA-Z0-9]+/, '').replace(/\/?>$/, '');
	while ((m = re.exec(body))) out[m[1].toLowerCase()] = decode(m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5] || '');
	return out;
}
function tags(html, name) { return html.match(new RegExp('<' + name + '\\b[^>]*>', 'gi')) || []; }
function digits(s) { let d = String(s || '').replace(/\D/g, ''); if (d.startsWith('61')) d = d.slice(2); return d.replace(/^0+/, ''); }
function typesOf(n) { const t = n['@type']; return Array.isArray(t) ? t : (t ? [t] : []); }

function flatten(blocks) {
	const nodes = []; const errors = [];
	for (const raw of blocks) {
		let data;
		try { data = JSON.parse(raw); } catch (e) { errors.push('Invalid JSON-LD: ' + e.message); continue; }
		const stack = Array.isArray(data) ? data.slice() : [data];
		while (stack.length) {
			const it = stack.pop();
			if (Array.isArray(it)) { stack.push(...it); continue; }
			if (it && typeof it === 'object') {
				if (it['@graph']) stack.push(...[].concat(it['@graph']));
				if (it['@type']) nodes.push(it);
			}
		}
	}
	return { nodes, errors };
}

function parseRobots(text) {
	const groups = {}; let agents = []; let lastAgent = false;
	for (let line of String(text || '').split(/\r?\n/)) {
		line = line.split('#')[0].trim();
		const i = line.indexOf(':'); if (i < 0) continue;
		const key = line.slice(0, i).trim().toLowerCase(); const val = line.slice(i + 1).trim();
		if (key === 'user-agent') {
			if (!lastAgent) agents = [];
			agents.push(val.toLowerCase()); groups[val.toLowerCase()] = groups[val.toLowerCase()] || []; lastAgent = true;
		} else if (key === 'allow' || key === 'disallow') {
			for (const a of agents) groups[a].push([key, val]); lastAgent = false;
		} else lastAgent = false;
	}
	return groups;
}
function blocksRoot(groups, agent) {
	const rules = groups[agent.toLowerCase()] || groups['*'] || [];
	return rules.some(r => r[0] === 'disallow' && r[1] === '/') && !rules.some(r => r[0] === 'allow' && r[1] === '/');
}

function check(html, robots) {
	html = String(html || '');
	const res = [];
	const add = (area, status, message) => res.push({ area, status, message });
	const metas = tags(html, 'meta').map(attrs);
	const meta = n => { const m = metas.find(a => (a.name || a.property || '').toLowerCase() === n); return m ? (m.content || '') : ''; };

	const tm = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i); const t = tm ? clean(tm[1]) : '';
	if (!t) add('Title', 'fail', 'Missing <title>.');
	else if (t.length < 30 || t.length > 65) add('Title', 'warn', `Title is ${t.length} characters (aim for 30-65): ${t}`);
	else add('Title', 'pass', `Title is ${t.length} characters: ${t}`);
	const d = meta('description');
	if (!d) add('Meta description', 'fail', 'Missing meta description.');
	else if (d.length < 70 || d.length > 160) add('Meta description', 'warn', `Meta description is ${d.length} characters (aim for 70-160).`);
	else add('Meta description', 'pass', `Meta description is ${d.length} characters.`);
	const h1 = (html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).map(clean);
	if (h1.length === 1) add('H1', 'pass', 'One H1: ' + h1[0]);
	else if (!h1.length) add('H1', 'fail', 'No H1 found.');
	else add('H1', 'warn', `${h1.length} H1s found. Use one.`);
	const canon = tags(html, 'link').map(attrs).find(a => (a.rel || '').toLowerCase().split(/\s+/).includes('canonical'));
	add('Canonical', canon ? 'pass' : 'warn', canon ? 'Canonical: ' + canon.href : 'No canonical link.');
	const noindex = /noindex/i.test(meta('robots'));
	add('Indexing', noindex ? 'fail' : 'pass', noindex ? 'Meta robots contains noindex.' : 'No noindex in meta robots.');
	const htmlTag = tags(html, 'html')[0]; const lang = htmlTag ? attrs(htmlTag).lang : '';
	add('Language', lang ? 'pass' : 'warn', lang ? `lang="${lang}"` : 'No lang attribute on <html>.');
	const imgs = tags(html, 'img').map(attrs); const noAlt = imgs.filter(a => !(a.alt || '').trim());
	if (imgs.length) add('Image alt text', noAlt.length ? 'warn' : 'pass', noAlt.length ? `${noAlt.length} of ${imgs.length} images missing alt text.` : `All ${imgs.length} images have alt text.`);
	const og = ['og:title', 'og:description', 'og:image'].filter(k => !meta(k));
	add('Open Graph', og.length ? 'warn' : 'pass', og.length ? 'Missing: ' + og.join(', ') : 'og:title, og:description and og:image set.');

	const blocks = []; const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi; let m;
	while ((m = re.exec(html))) if (/application\/ld\+json/i.test(m[1])) blocks.push(m[2]);
	const f = flatten(blocks);
	for (const e of f.errors) add('Structured data', 'fail', e);
	const found = [...new Set(f.nodes.flatMap(typesOf))].sort();
	add('Structured data', f.nodes.length ? 'pass' : 'fail', f.nodes.length ? 'JSON-LD types: ' + found.join(', ') : 'No JSON-LD found.');
	const isLocal = n => typesOf(n).some(x => LOCAL_TYPES.has(x));
	let biz = f.nodes.filter(n => isLocal(n) && n.address); if (!biz.length) biz = f.nodes.filter(isLocal);
	const body = (html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i) || [null, html])[1]
		.replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ');
	const text = clean(body);
	const tels = tags(html, 'a').map(attrs).filter(a => /^tel:/i.test(a.href || '')).map(a => digits(a.href.slice(4)));
	if (biz.length) {
		const b = biz[0]; const label = typesOf(b).join('/');
		const missing = RECOMMENDED.filter(k => !b[k]);
		add('Business schema', missing.length ? 'warn' : 'pass', missing.length ? `${label} is missing: ${missing.join(', ')}` : `${label} has all recommended properties.`);
		const tel = digits(b.telephone); const pageDigits = digits(text) + ' ' + tels.join(' ');
		if (tel) add('NAP: phone', pageDigits.includes(tel) ? 'pass' : 'warn', `Schema phone ${b.telephone} ${pageDigits.includes(tel) ? 'appears' : 'does not appear'} on the page.`);
		const addr = b.address || {}; const street = typeof addr === 'object' ? (addr.streetAddress || '') : String(addr);
		if (street) { const ok = text.toLowerCase().includes(street.replace(/\s+/g, ' ').toLowerCase()); add('NAP: address', ok ? 'pass' : 'warn', `Schema street address "${street}" ${ok ? 'appears' : 'does not appear'} in the visible text.`); }
		if (b.name) { const n = String(b.name).toLowerCase(); const ok = text.toLowerCase().includes(n) || t.toLowerCase().includes(n); add('NAP: name', ok ? 'pass' : 'warn', `Business name "${b.name}" ${ok ? 'appears' : 'does not appear'} on the page.`); }
	} else add('Business schema', 'fail', 'No LocalBusiness / Organization schema found.');
	if (f.nodes.some(n => typesOf(n).includes('FAQPage'))) add('FAQ schema', 'pass', 'FAQPage markup found (check every Q&A is visible on the page).');

	if (robots !== undefined && robots !== null) {
		if (String(robots).trim()) {
			const g = parseRobots(robots); const blocked = AI_CRAWLERS.filter(a => blocksRoot(g, a));
			add('AI crawlers', blocked.length ? 'warn' : 'pass', blocked.length ? 'robots.txt blocks: ' + blocked.join(', ') : `robots.txt allows all ${AI_CRAWLERS.length} AI crawlers checked.`);
			const sm = String(robots).match(/^\s*sitemap:\s*(\S+)/im);
			add('Sitemap', sm ? 'pass' : 'warn', sm ? 'Sitemap in robots.txt: ' + sm[1] : 'No Sitemap line in robots.txt.');
		} else add('AI crawlers', 'warn', 'robots.txt is empty or missing.');
	}
	return res;
}
function score(r) {
	const p = { pass: 1, warn: 0.5, fail: 0 }; const s = r.filter(x => x.status in p);
	return s.length ? Math.round(100 * s.reduce((a, x) => a + p[x.status], 0) / s.length) : 0;
}
module.exports = { check, score, parseRobots, blocksRoot, digits, AI_CRAWLERS };
