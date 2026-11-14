import {chromium} from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='scrollcraft/lab/film';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{for(const [name,width,height,reducedMotion] of [['desktop',1440,900,'no-preference'],['phone',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',1440,900,'reduce']]){
const c=await browser.newContext({viewport:{width,height},reducedMotion});await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};Document.prototype.exitPointerLock=()=>{}});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.VERIFY_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
if(reducedMotion==='reduce'){assert.equal(await p.locator('video').getAttribute('src'),null);await p.screenshot({path:`${out}/${name}.png`});results.push({name,poster:true,noVideoFetch:true});await c.close();continue}
await p.waitForFunction(()=>{const v=document.querySelector('video');return v?.readyState>=2&&document.querySelector('.film').classList.contains('sc-has-clip')});
const bounds=await p.locator('.film').evaluate(e=>({top:e.offsetTop,height:e.offsetHeight,vh:innerHeight}));const times=[];
for(const progress of [0,.25,.5,.75,1]){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top+progress*(bounds.height-bounds.vh));await p.waitForTimeout(1600);const state=await p.locator('video').evaluate(v=>({time:v.currentTime,duration:v.duration,paused:v.paused,ready:v.readyState,seeking:v.seeking}));times.push(state.time);await p.screenshot({path:`${out}/${name}-${progress}.png`});console.log(name,progress,state)}
assert.ok(times[4]-times[0]>2,'Video must advance with scroll');for(let i=1;i<times.length;i++)assert.ok(times[i]>times[i-1],`Forward progress ${i}`);
await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top+.2*(bounds.height-bounds.vh));await p.waitForTimeout(1500);const backwards=await p.locator('video').evaluate(v=>v.currentTime);assert.ok(backwards<times[3]-.8,'Reverse scroll must rewind');await p.screenshot({path:`${out}/${name}-reverse.png`});
const hold=await p.locator('video').evaluate(v=>v.currentTime);await p.waitForTimeout(700);const held=await p.locator('video').evaluate(v=>v.currentTime);assert.ok(Math.abs(held-hold)<.08,'Video must stop when scrolling stops');
await p.locator('#collection').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/${name}-collection.png`});assert.ok((await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)),'Horizontal overflow');assert.deepEqual(errors,[]);results.push({name,times,backwards,stationaryDrift:held-hold,errors});await c.close();}
fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));}finally{await browser.close()}
