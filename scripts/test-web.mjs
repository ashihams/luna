import {build} from '../web/node_modules/esbuild/lib/main.js';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
fs.mkdirSync('.audit',{recursive:true});
await build({entryPoints:['tests/web-regressions.ts'],bundle:true,platform:'node',format:'esm',outfile:'.audit/web-regressions.mjs'});
const result=spawnSync(process.execPath,['.audit/web-regressions.mjs'],{stdio:'inherit',env:{...process.env,TZ:'Asia/Kolkata'}});
process.exitCode=result.status??1;
