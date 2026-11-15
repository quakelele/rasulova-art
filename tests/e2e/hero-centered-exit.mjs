import {chromium} from 'playwright-core';import assert from 'node:assert/strict';import fs from 'node:fs';
fs.mkdirSync('artifacts/qa/hero-centered-exit',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [name,width,height]of [['desktop',1440,900],['phone',390,844]]){
const p=await b.newPage({viewport:{width,height},isMobile:name==='phone',hasTouch:name==='phone'});
await p.addInitScript(()=>{Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
await p.goto('http://127.0.0.1:4173');await p.locator('#startup-loader').waitFor({state:'detached'});
const geometry=await p.evaluate(()=>({pin:document.querySelector('.hero').offsetHeight-innerHeight,start:document.querySelector('.statement').getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight}));
for(const q of [.15,.5,.85]){
await p.evaluate(({pin,start,q})=>scrollTo(0,pin+(start-pin)*q),{...geometry,q});await p.waitForTimeout(800);
const s=await p.locator('.film-window').evaluate(e=>({scale:new DOMMatrix(getComputedStyle(e).transform).a,origin:getComputedStyle(e).transformOrigin,w:e.offsetWidth,h:e.offsetHeight}));
assert.ok(Math.abs(s.scale-(1-.28*q*q*(3-2*q)))<.002);const [x,y]=s.origin.split(' ').map(parseFloat);assert.ok(Math.abs(x-s.w/2)<.5&&Math.abs(y-s.h/2)<.5);
await p.screenshot({path:`artifacts/qa/hero-centered-exit/${name}-${q}.png`});console.log(name,q,s.scale);
}await p.close();}}finally{await b.close()}
