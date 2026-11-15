// Compare every scientific asset served by production with the reviewed local build.
// Usage: node scripts/audit-deployed.mjs https://lunaslipplanner.vercel.app
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const base = process.argv[2] || 'https://lunaslipplanner.vercel.app';
// Resolve from this checkout, so an archived Git commit can be verified without
// accidentally comparing against the caller's working tree.
const checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = path.join(checkoutRoot, 'web/public');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const catalogResponse = await fetch(`${base}/data/catalog.json`, { cache: 'no-store' });
if (!catalogResponse.ok) throw new Error(`Catalog HTTP ${catalogResponse.status}`);
const catalogBytes = Buffer.from(await catalogResponse.arrayBuffer());
const catalog = JSON.parse(catalogBytes);
const paths = new Set(['data/catalog.json', 'data/manifest.json', catalog.metrics_file,
  ...Object.values(catalog.pole_files), ...catalog.sites.flatMap(s => Object.values(s.files))]);
const rows = [];
const pending = [...paths];
async function worker() {
  while (pending.length) {
    const file = pending.shift();
    const res = await fetch(`${base}/${file}`, { cache: 'no-store', signal: AbortSignal.timeout(60000) });
    if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
    const actual = Buffer.from(await res.arrayBuffer());
    const expected = await fs.readFile(path.join(dataRoot, file.split('?')[0]));
    const match = digest(actual) === digest(expected);
    rows.push({ file, bytes: actual.length, sha256: digest(actual), match, cacheControl: res.headers.get('cache-control') });
    if (!match) throw new Error(`Production/local data mismatch: ${file}`);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
const report = { checkedAt: new Date().toISOString(), base, checkoutRoot, status: 'PASS', sites: catalog.sites.length, assets: rows.length, rows };
await fs.mkdir('.audit', { recursive: true });
await fs.writeFile('.audit/deployed-integrity.json', JSON.stringify(report, null, 2));
console.log(`PASS: ${rows.length} deployed scientific assets match local SHA-256 hashes across ${catalog.sites.length} sites.`);
