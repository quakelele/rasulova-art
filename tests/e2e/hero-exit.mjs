import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out='artifacts/qa/hero-exit';fs.mkdirSync(out,{recursive:true});const results=[];
try{
 for(const[mode,width,height]of[['wheel',1440,1000],['keyboard',1440,1000],['touch',390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mode==='touch',hasTouch:mode==='touch'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelector('.film').classList.contains('has-sequence'));
  const pin=await page.locator('.film').evaluate(e=>e.offsetHeight-innerHeight),travel=pin*.82;
  // Programmatic jumps and deep links must not trigger a handoff on their own.
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),travel*1.02);await page.waitForTimeout(1000);assert.notEqual(await page.locator('.film').getAttribute('data-exit-state'),'complete');
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),travel*.68);await page.waitForTimeout(500);
  if(mode==='wheel')await page.mouse.wheel(0,travel*.4);
  if(mode==='keyboard')await page.keyboard.press('PageDown');
  if(mode==='touch'){
   const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:730}]});
   for(let y=710;y>=120;y-=25){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y}]});await page.waitForTimeout(20)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForFunction(()=>document.querySelector('.film').dataset.exitState==='complete',{},{timeout:10000});
  assert.equal(await page.locator('.film').getAttribute('data-frame'),'0');
  const arrival=await page.evaluate(()=>scrollY),headerHeight=await page.locator('.header').evaluate(e=>e.getBoundingClientRect().height);assert.ok(Math.abs(await page.locator('.statement').evaluate(e=>e.getBoundingClientRect().top)-headerHeight)<3);
  await page.screenshot({path:`${out}/${mode}-arrival.png`});
  await page.mouse.wheel(0,280);await page.waitForTimeout(700);const later=await page.evaluate(()=>scrollY);assert.ok(later>arrival+200,'Normal scrolling resumes after the handoff');await page.waitForTimeout(700);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-later)<3,'No further snapping');
  // Upward input cancels the transfer instead of forcing the reader down.
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),travel*.7);await page.waitForTimeout(500);await page.mouse.wheel(0,travel*.4);
  await page.waitForFunction(()=>document.querySelector('.film').dataset.exitState==='moving');await page.mouse.wheel(0,-220);await page.waitForTimeout(250);assert.equal(await page.locator('.film').getAttribute('data-exit-state'),'cancelled');const stopped=await page.evaluate(()=>scrollY);await page.waitForTimeout(700);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-stopped)<3);
  assert.deepEqual(errors,[]);results.push({mode,arrival,normalScroll:true,cancel:true,errors});console.log(results.at(-1));await context.close();
 }
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await reduced.mouse.wheel(0,1000);await reduced.waitForTimeout(700);assert.notEqual(await reduced.locator('.film').getAttribute('data-exit-state'),'moving');await reduced.close();
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
