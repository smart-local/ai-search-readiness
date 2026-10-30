#!/usr/bin/env node
'use strict';
const fs = require('fs');
const { checkUrl, checkHtml } = require('../lib');
const pkg = require('../package.json');

const HELP = `ai-search-readiness ${pkg.version}
Check a local business page for Google and AI search readiness. By Smart Local - https://smart-local.com.au/

Usage:
  ai-search-readiness <url> [--json] [--no-robots] [--min-score N]
  ai-search-readiness --html page.html [--robots robots.txt] [--json] [--min-score N]

Options:
  --json         Print the report as JSON
  --no-robots    Skip the robots.txt AI crawler check
  --html FILE    Check a saved HTML file instead of fetching a URL
  --robots FILE  robots.txt to use with --html
  --min-score N  Exit with code 1 if the score is below N (for CI)
  -v, --version  Print the version
`;

function arg(args, name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }

async function main(args) {
	if (args.includes('-v') || args.includes('--version')) return console.log(pkg.version);
	const htmlFile = arg(args, '--html');
	const url = args.find((a, i) => !a.startsWith('-') && !['--html', '--robots', '--min-score'].includes(args[i - 1]));
	if (args.includes('-h') || args.includes('--help') || (!url && !htmlFile)) { console.log(HELP); return; }
	let report;
	if (htmlFile) {
		const robotsFile = arg(args, '--robots');
		report = checkHtml(fs.readFileSync(htmlFile, 'utf8'), robotsFile ? fs.readFileSync(robotsFile, 'utf8') : undefined);
	} else {
		report = await checkUrl(url, { robots: !args.includes('--no-robots') });
	}
	if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
	else {
		if (report.url) console.log(report.url);
		console.log(`Score: ${report.score}/100\n`);
		for (const r of report.results) console.log(`[${r.status.toUpperCase()}] ${r.area.padEnd(16)} ${r.message}`);
		console.log('\nHow to fix: https://smart-local.com.au/resources/ai-visibility-checklist/');
	}
	const min = arg(args, '--min-score');
	if (min !== undefined && report.score < Number(min)) process.exitCode = 1;
}

main(process.argv.slice(2)).catch(e => { console.error('Error:', e.message); process.exitCode = 2; });
