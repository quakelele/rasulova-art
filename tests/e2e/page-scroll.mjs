import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],out='artifacts/qa/lenis';fs.mkdirSync(out,{recursive:true});
try{
 for(const [name,width,height,reducedMotion] of [['desktop',1440,900,'no-preference'],['laptop',1366,768,'no-preference'],['phone',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',1440,900,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<650,hasTouch:width<650,reducedMotion});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
 const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
 assert.ok(await page.locator('html').evaluate(e=>e.classList.contains('lenis')));
 const statement=page.locator('.statement'),decor=page.locator('.catalog-category').first();
 await statement.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(150);
 const starting=await page.evaluate(()=>scrollY);
 if(reducedMotion!=='reduce'){
  await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,100);await page.waitForTimeout(1200);
  const diff=await decor.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight);
  assert.ok(Math.abs(diff)<2,`One wheel advances one section: ${diff}`);
  await page.mouse.wheel(0,-100);await page.waitForTimeout(1200);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-starting)<2,'Reverse returns to prior section');
  // Trackpad tail is part of the same gesture, not six page changes.
  for(let i=0;i<6;i++){await page.mouse.wheel(0,20);await page.waitForTimeout(45)}await page.waitForTimeout(1200);
  assert.ok(Math.abs(await decor.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2);
 }else{
  await page.mouse.wheel(0,100);await page.waitForTimeout(400);const dy=await page.evaluate(()=>scrollY)-starting;assert.ok(dy>50&&dy<200,'Reduced motion uses native scrolling');
 }
 await page.locator('.navigation a[href="#atelier"]').evaluate(e=>e.click());await page.waitForTimeout(1300);
 assert.ok(Math.abs(await page.locator('#atelier').evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'Anchors align below header');
 await page.waitForFunction(()=>[...document.querySelectorAll('.atelier-slider img')].slice(0,2).every(i=>i.naturalWidth>0));
 const atelier=await page.locator('.atelier-slider').evaluate(e=>({width:e.clientWidth,parent:e.parentElement.clientWidth}));assert.ok(atelier.width<=atelier.parent);
 await page.screenshot({path:`${out}/${name}-atelier-final.png`});
 await decor.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(300);
 const beforeOpen=await page.evaluate(()=>scrollY),box=await decor.locator('.image-button').first().boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(500);
 assert.ok(await page.locator('html').evaluate(e=>e.classList.contains('lenis-stopped')));
 const locked=await page.evaluate(()=>scrollY);assert.ok(Math.abs(locked-beforeOpen)<2,'Opening does not move the page');await page.mouse.wheel(0,300);await page.waitForTimeout(400);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-locked)<2);
 await page.keyboard.press('Escape');await page.waitForTimeout(500);assert.equal(await page.locator('html').evaluate(e=>e.classList.contains('lenis-stopped')),false);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-locked)<2);
 await page.screenshot({path:`${out}/${name}-collection-final.png`});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 results.push({name,oneGesture:true,anchors:true,modal:true,errors,bad});console.log(results.at(-1));await context.close();
 }
 fs.writeFileSync(`${out}/functional-results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
