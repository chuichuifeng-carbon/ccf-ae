import fs from 'node:fs';

if (!process.argv.includes('--live')) throw new Error('Pass --live to check public ccfrp.com links over the network.');
const urls = new Set();
for (const file of fs
  .readdirSync('dist', { recursive: true })
  .filter((f) => f.endsWith('.html') && !f.startsWith('decapcms'))) {
  for (const match of fs.readFileSync(`dist/${file}`, 'utf8').matchAll(/href="(https:\/\/ccfrp\.com[^" ]*)"/g)) {
    const url = new URL(match[1].replaceAll('&amp;', '&'));
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    urls.add(url.toString());
  }
}
const queue = [...urls];
const results = [];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    let target;
    while ((target = queue.shift())) {
      try {
        let response = await fetch(target, { method: 'HEAD', signal: AbortSignal.timeout(12000) });
        if ([405, 501].includes(response.status)) {
          response = await fetch(target, { headers: { Range: 'bytes=0-1023' }, signal: AbortSignal.timeout(12000) });
        }
        const status = response.status;
        const type = response.headers.get('content-type');
        const finalUrl = response.url;
        await response.body?.cancel();
        let fragment = 'not applicable';
        const parsed = new URL(target);
        if (response.ok && parsed.hash && !parsed.pathname.endsWith('.pdf')) {
          const page = await fetch(target, { signal: AbortSignal.timeout(12000) });
          const html = await page.text();
          const anchor = decodeURIComponent(parsed.hash.slice(1));
          fragment = html.includes(`id="${anchor}"`) || html.includes(`id='${anchor}'`) ? 'passed' : 'not found';
        }
        results.push({
          url: target,
          status,
          type,
          finalUrl,
          fragment,
          result: response.ok && fragment !== 'not found' ? 'passed' : 'needs review',
        });
      } catch (error) {
        results.push({ url: target, result: 'unverified', reason: error.message });
      }
    }
  })
);
results.sort((a, b) => a.url.localeCompare(b.url));
const output = process.argv.find((arg) => arg.startsWith('--out='))?.slice(6) || 'reports/prelaunch-qa-2026-10-31';
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  `${output}/external-links.json`,
  JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n'
);
console.log(
  JSON.stringify({
    checked: results.length,
    passed: results.filter((r) => r.result === 'passed').length,
    needsReview: results.filter((r) => r.result !== 'passed'),
  })
);
