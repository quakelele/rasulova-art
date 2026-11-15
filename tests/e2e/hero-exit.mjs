import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='artifacts/qa/hero-exit';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),results=[];
try{
 for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<650,hasTouch:width<650});
  await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
  const pin=await page.locator('.film').evaluate(e=>e.offsetHeight-innerHeight);
  const frames=[];
  for(const p of [0,.45,1]){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),pin*p);await page.waitForTimeout(900);
   frames.push(Number(await page.locator('.film').getAttribute('data-frame')));
   await page.screenshot({path:`${out}/${name}-film-${p}.png`});
  }
  assert.ok(frames[0]>185&&frames[1]>80&&frames[1]<130&&frames[2]===0,JSON.stringify(frames));
  assert.ok(Math.abs(await page.locator('.film-stage').evaluate(e=>e.getBoundingClientRect().top))<2,'Last frame completes while pinned');
  await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,100);await page.waitForTimeout(1300);
  assert.ok(Math.abs(await page.locator('.statement').evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2);
  await page.mouse.wheel(0,-100);await page.waitForTimeout(1300);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-pin)<2);
  await page.mouse.wheel(0,-180);await page.waitForTimeout(1000);assert.ok(await page.evaluate(()=>scrollY)<pin-100,'Reverse can scrub back into the film');
  // Crossing out of the film also settles to a complete chapter.
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),pin-80);await page.waitForTimeout(500);
  await page.mouse.wheel(0,180);await page.waitForTimeout(2200);
  assert.ok(Math.abs(await page.locator('.statement').evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'Film exit settles to statement');
  if(width<650){
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:700}]});
   for(let y=680;y>=240;y-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(25)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(2200);
   const distance=await page.evaluate(()=>Math.min(...[...document.querySelectorAll('.statement,.catalog-category,.collection-archive,.atelier')].map(e=>Math.abs(e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))));
   assert.ok(distance<2,`Touch settles on a chapter: ${distance}`);
   // Horizontal gestures still belong to Swiper.
   await page.locator('.catalog-category').first().evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(800);
   const slider=page.locator('.works-slider').first(),box=await slider.locator('.image-button').first().boundingBox(),y=box.y+80,scrollBefore=await page.evaluate(()=>scrollY);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:330,y}]});
   for(let x=310;x>=55;x-=15){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await page.waitForTimeout(20)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1200);
   assert.ok(await slider.evaluate(e=>e.swiper.activeIndex)>0);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<2);
  }
  results.push({name,frames,heroExit:true,reverse:true,touch:width<650});console.log(results.at(-1));await context.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
