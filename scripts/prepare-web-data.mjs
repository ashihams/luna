// Derive a compact, lossless metrics bundle from the existing scientific artifacts.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/public');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/manifest.json'), 'utf8'));
const hash = b => createHash('sha256').update(b).digest('hex').slice(0,16);
const parts=[];
for (const site of catalog.sites) {
  const raw=fs.readFileSync(path.join(root,site.files.tracks));
  for(const name of ['sun_vis_pct','earth_clearance']) {
    const field=site.tracks_layout.find(f=>f.name===name);
    parts.push(raw.subarray(field.byte_offset,field.byte_offset+field.byte_length));
  }
  for(const key of Object.keys(site.files)) {
    const file=site.files[key];
    site.files[key]=`${file}?v=${hash(fs.readFileSync(path.join(root,file)))}`;
  }
}
const bundle=Buffer.concat(parts);
catalog.metrics_file=`data/metrics-${hash(bundle)}.bin`;
catalog.pole_files=Object.fromEntries(['pole_overview.bin','pole_overview_meta.json'].map(file=>[file,`data/${file}?v=${hash(fs.readFileSync(path.join(root,'data',file)))}`]));
for(const key of ['t0_utc','t1_utc']) if(!catalog.time[key].endsWith('Z')) catalog.time[key]+='Z';
for(const key of ['T0_UTC','T1_UTC']) if(!catalog.constants[key].endsWith('Z')) catalog.constants[key]+='Z';
fs.writeFileSync(path.join(root,catalog.metrics_file),bundle);
fs.writeFileSync(path.join(root,'data/catalog.json'),JSON.stringify(catalog));
console.log(`Metrics bundle: ${bundle.length} bytes, ${gzipSync(bundle).length} bytes gzipped; ${catalog.sites.length} sites.`);
