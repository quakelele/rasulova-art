import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='artifacts/qa/chapter-cards';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [name,width,height,reduced]of [['desktop',1440,900,false],['phone',390,844,false],['reduced',390,844,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop',isMobile:name!=='desktop',reducedMotion:reduced?'reduce':'no-preference'});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');await page.locator('#startup-loader').waitFor({state:'detached'});
 assert.equal(await page.locator('[data-card-exit]').count(),2);
 for(let i=0;i<2;i++){
  const card=page.locator('[data-card-exit]').nth(i);
  const geo=await card.evaluate(el=>{const top=e=>{let y=0;for(let n=e;n;n=n.offsetParent)y+=n.offsetTop;return y};const next=el.matches('.statement')?document.querySelector('.catalog-category'):document.querySelectorAll('.catalog-category')[1];return {end:Math.max(top(el)-document.querySelector('.header').offsetHeight,top(el)+el.offsetHeight-innerHeight),next:top(next)-document.querySelector('.header').offsetHeight}});
  for(const p of [0,.5,.85]){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geo.end+(geo.next-geo.end)*p);await page.waitForTimeout(500);
   const scale=await card.evaluate(el=>getComputedStyle(el).scale);if(reduced)assert.equal(scale,'none');else assert.ok(Math.abs(Number(scale)-(1-.28*p*p*(3-2*p)))<.003);
   if(p===.5){const before=await card.evaluate(e=>getComputedStyle(e).scale);await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(300);assert.equal(await card.evaluate(e=>getComputedStyle(e).scale),before,'Measuring a scaled chapter does not shift its timeline');}
   await page.screenshot({path:`${out}/${name}-${i}-${p}.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log(name,'two centered exits, stable geometry, reduced-motion respected');await context.close();
}}finally{await browser.close()}
