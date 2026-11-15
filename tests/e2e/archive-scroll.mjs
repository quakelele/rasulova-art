import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='artifacts/qa/archive-scroll';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['phone',390,844],['compact',360,640]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:width<650,hasTouch:width<650,reducedMotion:'no-preference'});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
 const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
 const archive=page.locator('.collection-archive'),selection=page.locator('.collection-selection'),atelier=page.locator('#atelier');
 assert.equal(await archive.locator('button[aria-expanded]').getAttribute('aria-expanded'),'true');assert.ok(await archive.locator('.swiper-slide').count()>50);
 async function align(el){await el.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(850)}
 async function click(el){const b=await el.boundingBox();await page.mouse.click(b.x+b.width/2,b.y+b.height/2)}
 const aligned=el=>el.evaluate(e=>Math.abs(e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight)<2);
 await align(archive);await page.waitForFunction(()=>document.querySelector('.archive-slider img').naturalWidth>0);
 const geometry=await archive.evaluate(e=>({height:e.offsetHeight,space:innerHeight-document.querySelector('.header').offsetHeight,image:e.querySelector('.work-image').offsetHeight,slider:e.querySelector('.archive-slider').getBoundingClientRect().toJSON()}));
 assert.ok(geometry.image>=180,JSON.stringify(geometry));
 await page.screenshot({path:`${out}/${name}-archive.png`});
 const before=await page.evaluate(()=>scrollY);await click(archive.locator('.swiper-button-next'));await page.waitForTimeout(700);assert.ok(await archive.locator('.archive-slider').evaluate(e=>e.swiper.activeIndex)>0);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-before)<2);
 if(geometry.height<=geometry.space+3){
  await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,100);await page.waitForTimeout(1200);assert.ok(await aligned(selection),'Archive advances to shelf');
  await page.mouse.wheel(0,100);await page.waitForTimeout(1200);assert.ok(await aligned(atelier),'Shelf advances to atelier');
  await page.mouse.wheel(0,-100);await page.waitForTimeout(1200);assert.ok(await aligned(selection));await page.mouse.wheel(0,-100);await page.waitForTimeout(1200);assert.ok(await aligned(archive));
 }
 await align(archive);await click(archive.locator('button[aria-expanded]'));await page.waitForTimeout(500);assert.equal(await selection.count(),0);assert.equal(await archive.locator('.archive-slider').count(),0);assert.equal(await archive.locator('.exhibition').count(),1);
 await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,100);await page.waitForTimeout(1200);assert.ok(await aligned(atelier),'Collapsed section updates snap targets');
 await align(archive);await click(archive.locator('button[aria-expanded]'));await page.waitForTimeout(500);assert.equal(await selection.count(),1);
 if(geometry.height<=geometry.space+3){await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,100);await page.waitForTimeout(1200);assert.ok(await aligned(selection),'Reopening restores snap target')}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log(name,geometry,{errors,bad});await context.close();
 }
}finally{await browser.close()}
