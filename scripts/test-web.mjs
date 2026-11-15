import {build} from '../web/node_modules/esbuild/lib/main.js';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditDir = path.join(rootDir, '.audit');
fs.mkdirSync(auditDir, {recursive: true});

const testEntry = path.join(rootDir, 'tests/web-regressions.ts');
const outfile = path.join(auditDir, 'web-regressions.mjs');

await build({
  entryPoints: [testEntry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  absWorkingDir: rootDir
});

const result = spawnSync(process.execPath, [outfile], {
  stdio: 'inherit',
  cwd: rootDir,
  env: {...process.env, TZ: 'Asia/Kolkata'}
});
process.exitCode = result.status ?? 1;
