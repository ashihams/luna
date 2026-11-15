import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const target = process.argv[2] || 'https://lunaslipplanner.vercel.app';
const out = path.resolve(process.argv[3] || '.audit');
fs.mkdirSync(out,{recursive:true});
const profile = path.join(out, `chrome-${Date.now()}`);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {windowsHide:true, stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let ws;
try {
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++) await sleep(100);
  const [port, endpoint] = fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').trim().split(/\r?\n/);
  ws = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  let seq=0;const pending=new Map(); const listeners=[];
  ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.j(new Error(JSON.stringify(m.error))):p.r(m.result)}}else listeners.forEach(f=>f(m));};
  const send=(method,params={},sessionId)=>new Promise((r,j)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);j(new Error(`Timeout ${method}`))},90000);pending.set(id,{r,j,timer});ws.send(JSON.stringify({id,method,params,sessionId}))});
  const results=[];
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  for(const mode of ['desktop','mobile-4g']) {
    const {browserContextId}=await send('Target.createBrowserContext');
    const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});
    const {sessionId:sid}=await send('Target.attachToTarget',{targetId,flatten:true});
    const c=(m,p={})=>send(m,p,sid);
    const ev=async(expression)=>{const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value};
    const errors=[], requests=[], failures=[];const requestUrls=new Map();
    listeners.push(m=>{if(m.sessionId!==sid)return;const p=m.params;if(m.method==='Runtime.exceptionThrown')errors.push(p.exceptionDetails);if(m.method==='Runtime.consoleAPICalled'&&p.type==='error')errors.push(p.args);if(m.method==='Log.entryAdded'&&p.entry.level==='error')errors.push(p.entry);if(m.method==='Network.requestWillBeSent')requestUrls.set(p.requestId,p.request.url);if(m.method==='Network.responseReceived')requests.push({url:p.response.url,status:p.response.status,mime:p.response.mimeType,cache:p.response.fromDiskCache,encoding:p.response.headers['content-encoding']});if(m.method==='Network.loadingFailed')failures.push({...p,url:requestUrls.get(p.requestId)});});
    await c('Page.enable');await c('Runtime.enable');await c('Log.enable');await c('Network.enable');await c('Network.setCacheDisabled',{cacheDisabled:true});
    await c('Emulation.setDeviceMetricsOverride',{width:mode==='desktop'?1440:390,height:mode==='desktop'?900:844,deviceScaleFactor:mode==='desktop'?1:3,mobile:mode!=='desktop'});
    if(mode!=='desktop') {await c('Emulation.setTouchEmulationEnabled',{enabled:true});await c('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1000000/8,uploadThroughput:750000/8,connectionType:'cellular4g'});await c('Emulation.setCPUThrottlingRate',{rate:4});}
    const begin=Date.now();await c('Page.navigate',{url:target+'/#planner'});
    let ready=false;
    while(Date.now()-begin<60000){if(await ev(`!!document.querySelector('input[aria-label="Launch slip days"]')`)){ready=true;break;}await sleep(100);}
    const readyMs=Date.now()-begin;
    const timing=await ev(`({slider:document.querySelector('input[aria-label="Launch slip days"]')?.getBoundingClientRect().toJSON(),navigation:performance.getEntriesByType('navigation')[0]?.toJSON(),paint:performance.getEntriesByType('paint').map(x=>x.toJSON()),resources:performance.getEntriesByType('resource').map(x=>({name:x.name,duration:x.duration,transferSize:x.transferSize,encodedBodySize:x.encodedBodySize,decodedBodySize:x.decodedBodySize})),viewport:{width:innerWidth,scrollWidth:document.documentElement.scrollWidth},body:document.body.innerText})`);
    assert(await ev(`!!document.querySelector('[data-testid="model-notice"]')`), 'Missing model uncertainty notice');
    fs.writeFileSync(path.join(out,`${mode}-planner.png`),Buffer.from((await c('Page.captureScreenshot',{format:'png'})).data,'base64'));
    const slides=[];
    if(ready){for(const value of [0,1,2,3,4,5,10,14]){const t=Date.now();await ev(`(()=>{const x=document.querySelector('input[aria-label="Launch slip days"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,'${value}');x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));})()`);await sleep(150);slides.push({value,elapsedMs:Date.now()-t,text:await ev(`document.querySelector('input[aria-label="Launch slip days"]').parentElement.parentElement.innerText`)});}}
    console.log(JSON.stringify({mode,ready,readyMs,errors:errors.length,failures:failures.length}));
    await ev(`location.hash='site'`);await sleep(5000);
    const site=await ev(`({text:document.body.innerText,canvases:[...document.querySelectorAll('canvas')].map(x=>({width:x.width,height:x.height,rect:x.getBoundingClientRect().toJSON()})),horizonPaths:document.querySelectorAll('svg path[fill="#0f141f"]').length,svgPaths:[...document.querySelectorAll('svg path[stroke="#f59e0b"]')].length})`);
    fs.writeFileSync(path.join(out,`${mode}-site.png`),Buffer.from((await c('Page.captureScreenshot',{format:'png'})).data,'base64'));
    assert(site.horizonPaths===1, `${mode}: missing terrain silhouette`);
    assert(site.canvases[0]?.rect.height>300, `${mode}: collapsed 3D canvas`);
    assert(timing.slider?.width>200, `${mode}: collapsed slip slider`);
    await ev(`window.auditCanvas=document.querySelector('canvas');`);
    const scrubChecks=[];
    for(const value of [15,40,100,200]) {
      await ev(`(()=>{const x=document.querySelector('input[aria-label="Mission time"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,'${value}');x.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await sleep(180);
      const state=await ev(`({status:document.querySelector('[data-testid="sun-status"]').innerText,plot:document.querySelector('.sky-plot').innerText,sameCanvas:window.auditCanvas===document.querySelector('canvas')})`);
      assert(state.sameCanvas, 'Scrubbing recreated the WebGL canvas');
      assert(state.plot.includes(state.status.startsWith('Sunlit')?'· Sunlit':'· Dark'), 'Sky/status classification disagreement');
      scrubChecks.push({value,...state});
    }
    await ev(`location.hash='planner'`);await sleep(300);
    await ev(`(()=>{const x=document.querySelector('input[aria-label="Launch slip days"]');x.focus();})()`);
    await c('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    await c('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    assert(await ev(`document.querySelector('input[aria-label="Launch slip days"]').value`)==='15','Keyboard slip slider did not advance by one');
    await ev(`(()=>{const x=document.querySelector('input[aria-label="Launch slip days"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,'14');x.dispatchEvent(new Event('input',{bubbles:true}));const t=document.querySelector('input[aria-label="Solar disc threshold"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(t,'90');t.dispatchEvent(new Event('input',{bubbles:true}));const a=document.querySelector('input[aria-label="Antenna horizon mask"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(a,'1.5');a.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await ev(`location.hash='site'`);await sleep(1500);
    const thresholdCheck=await ev(`({status:document.querySelector('[data-testid="sun-status"]').innerText,plot:document.querySelector('.sky-plot').innerText,mask:document.querySelector('[data-testid="antenna-mask"]')?.getAttribute('d')})`);
    assert(thresholdCheck.status.includes('threshold 90%'), '90% threshold not applied');
    assert(thresholdCheck.plot.includes(thresholdCheck.status.startsWith('Sunlit') ? '· Sunlit' : '· Dark'), 'Sky/status disagreement at 90% threshold');
    assert(thresholdCheck.mask?.includes('L'), 'Missing terrain-relative antenna mask');
    site.scrubChecks=scrubChecks;site.thresholdCheck=thresholdCheck;
    await ev(`location.hash='pole'`);await sleep(5000);
    const pole=await ev(`({text:document.body.innerText,canvasCount:document.querySelectorAll('canvas').length})`);
    assert(pole.canvasCount > 0, 'Missing pole overview canvas');
    const siteSelections=[];
    if(mode==='desktop') {
      await ev(`location.hash='planner'`); await sleep(250);
      const ids=await ev(`[...document.querySelector('select[aria-label="Landing site"]').options].map(o=>o.value)`);
      for(const id of ids) {
        await ev(`(()=>{const x=document.querySelector('select[aria-label="Landing site"]');x.value=${JSON.stringify(id)};x.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        const deadline=Date.now()+20000;
        while(Date.now()<deadline&&!requests.some(r=>r.url.includes('horizon_'+id+'.json')&&r.status===200)) await sleep(100);
        assert(requests.some(r=>r.url.includes('horizon_'+id+'.json')&&r.status===200), `Missing horizon load: ${id}`);
        await sleep(150);
        const selected=await ev(`document.querySelector('select[aria-label="Landing site"]').value`);
        assert(selected===id, `Site selection failed: ${id}`);
        siteSelections.push(id);
      }
      await ev(`(()=>{const x=document.querySelector('input[aria-label="Planned landing date"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,'2028-12-31');x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await sleep(300);
      assert(await ev(`(()=>{const x=document.querySelector('input[aria-label="Planned landing date"]');return x.value===x.max;})()`), 'Incomplete end-of-data stay was not clamped');
    }
    assert(errors.length===0, `${mode}: browser errors`);
    assert(failures.length===0, `${mode}: failed requests`);
    assert(!requests.some(r=>r.status>=400), `${mode}: HTTP errors`);
    site.siteSelections=siteSelections;
    results.push({mode,ready,readyMs,timing,slides,site,pole,errors,failures,requests});fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({mode,horizonPaths:site.horizonPaths,canvas:site.canvases,threshold:site.thresholdCheck.status,scrubChecks:site.scrubChecks.length,errors,failures}));
    await send('Target.disposeBrowserContext',{browserContextId});
  }
  await send('Browser.close');
} finally {ws?.close();chrome.kill();}
