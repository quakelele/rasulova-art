import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
fs.mkdirSync('artifacts/qa/mobile-jank',{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const context=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{
  Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};
  window.__canvas={writes:0,unchanged:0};
  for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,key);Object.defineProperty(HTMLCanvasElement.prototype,key,{...d,set(v){window.__canvas.writes++;if(d.get.call(this)===v)window.__canvas.unchanged++;d.set.call(this,v)}})}
 });
 const page=await context.newPage();await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
 await page.evaluate(()=>{window.__canvas={writes:0,unchanged:0};for(let i=0;i<12;i++)window.dispatchEvent(new Event('resize'))});
 const canvas=await page.evaluate(()=>window.__canvas);
 await page.locator('.statement').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(300);
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:600}]});
 for(let y=590;y>=520;y-=10){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(18)}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(140);
 await page.setViewportSize({width:390,height:760});await page.waitForTimeout(1300);
 const alignment=await page.locator('.catalog-category').first().evaluate(e=>({top:e.getBoundingClientRect().top,expected:document.querySelector('.header').offsetHeight,error:e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight}));
 const result={canvas,alignment};console.log(result);fs.writeFileSync('artifacts/qa/mobile-jank/after.json',JSON.stringify(result,null,2));assert.equal(canvas.writes,0);assert.ok(Math.abs(alignment.error)<2);
}finally{await b.close()}
