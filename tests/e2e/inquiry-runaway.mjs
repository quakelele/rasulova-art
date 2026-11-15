import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out='artifacts/qa/inquiry-runaway';fs.mkdirSync(out,{recursive:true});
try{
 for(const [name,width,height] of [['phone',390,844],['large',430,932]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};window.__scrollCalls=[];const original=window.scrollTo.bind(window);window.scrollTo=(...args)=>{window.__scrollCalls.push(args);return original(...args)}});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
 const cdp=await context.newCDPSession(page);
 for(const section of ['#inquiry']){
 async function align(){await page.locator(section).evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(500);await page.evaluate(()=>window.__scrollCalls=[])}
 for(const dir of [1,-1]){
  await align();const start=await page.evaluate(()=>scrollY);await page.mouse.move(width/2,350);
  for(let i=0;i<8;i++){await page.mouse.wheel(0,dir*45);await page.waitForTimeout(40)}
  await page.waitForTimeout(700);const stop=await page.evaluate(()=>scrollY);await page.waitForTimeout(1400);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-stop)<2,'No autonomous continuation after input');
  assert.equal(await page.evaluate(()=>window.__scrollCalls.length),0,'No JS scroll corrections during native form wheel gesture');
  assert.ok(Math.abs(stop-start)<=8*45+5,'No amplification of wheel movement');
 }
 for(const dir of [1,-1]){
  await align();const start=await page.evaluate(()=>scrollY),y=dir===1?height-140:190;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:y-dir*i*10}]});await page.waitForTimeout(32)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(700);
  const stop=await page.evaluate(()=>scrollY);await page.waitForTimeout(1200);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-stop)<2);assert.ok(await page.evaluate(()=>window.__scrollCalls.length)<=14,'At most one scroll update per touch move and release, no inertial tail');assert.ok(Math.abs(stop-start)<height,'One slow gesture cannot launch through the page');
 }
 console.log(name,section,'wheel/touch both directions: bounded movement, no runaway');
 }await context.close();
 }
}finally{await browser.close()}
