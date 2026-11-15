import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='artifacts/qa/chapter-cards';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [name,width,height,reduced]of [['desktop',1440,900,false],['phone',390,844,false],['reduced',390,844,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop',isMobile:name!=='desktop',reducedMotion:reduced?'reduce':'no-preference'});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');await page.locator('#startup-loader').waitFor({state:'detached'});
 const count=await page.locator('[data-card-exit]').count();assert.equal(count,await page.locator('.statement,.catalog-category,.collection-archive,.collection-selection,.atelier,.selection-inquiry,.contacts-section').count());
 for(let i=0;i<count;i++){
  const card=page.locator('[data-card-exit]').nth(i);
  const geo=await card.evaluate(el=>{const top=e=>{let y=0;for(let n=e;n;n=n.offsetParent)y+=n.offsetTop;return y};const cards=[...document.querySelectorAll('[data-card-exit]')];const next=cards[cards.indexOf(el)+1];return {end:Math.max(top(el)-document.querySelector('.header').offsetHeight,top(el)+el.offsetHeight-innerHeight),next:next?top(next)-document.querySelector('.header').offsetHeight:Math.max(top(el)-document.querySelector('.header').offsetHeight,top(el)+el.offsetHeight-innerHeight)+innerHeight}});
  for(const p of [0,.5,.85]){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geo.end+(geo.next-geo.end)*p);await page.waitForTimeout(500);
   const actual=await page.evaluate(({end,next})=>(scrollY-end)/(next-end),geo);const progress=Math.max(0,Math.min(1,actual));const scale=await card.evaluate(el=>getComputedStyle(el).scale);if(reduced)assert.equal(scale,'none');else assert.ok(Math.abs(Number(scale)-(1-.28*progress*progress*(3-2*progress)))<.003);
   if(p===.5){const before=await card.evaluate(e=>getComputedStyle(e).scale);await page.evaluate(()=>dispatchEvent(new Event('resize')));await page.waitForTimeout(300);assert.equal(await card.evaluate(e=>getComputedStyle(e).scale),before,'Measuring a scaled chapter does not shift its timeline');}
   await page.screenshot({path:`${out}/${name}-${i}-${p}.png`});
  }
 }
 assert.deepEqual(errors,[]);console.log(name,'all centered exits, stable geometry, reduced-motion respected');await context.close();
}}finally{await browser.close()}
