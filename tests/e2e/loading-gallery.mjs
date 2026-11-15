import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const mode of ['desktop','mobile','fallback','reduced']){
  const context=await browser.newContext({viewport:mode==='desktop'?{width:1440,height:1000}:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference',isMobile:mode!=='desktop',hasTouch:mode!=='desktop'});
  if(mode==='fallback')await context.addInitScript(()=>{window.createImageBitmap=()=>Promise.reject(new Error('Simulated decoder rejection'))});
  const page=await context.newPage(),errors=[],frames=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/sequence/')&&r.url().includes('frame-'))frames.push(r.url())});
  await page.goto('http://127.0.0.1:4173');
  await page.locator('#startup-loader').waitFor({state:'detached',timeout:16000});
  if(mode!=='reduced'){
   assert.ok(await page.locator('.hero').evaluate(e=>e.classList.contains('has-sequence')),'First frame is painted before loader disappears');
   assert.ok(frames.length<20,`Initial frame requests bounded: ${frames.length}`);
   const first=await page.locator('.hero').getAttribute('data-frame');
   await page.evaluate(()=>scrollTo({top:700,behavior:'instant'}));
   await page.waitForFunction(initial=>document.querySelector('.hero').dataset.frame!==initial,first);
  }else assert.equal(frames.length,0);
  await page.locator('.works-slider').first().evaluate(e=>{e.swiper.slideTo(2,0);e.scrollIntoView({block:'center',behavior:'instant'})});
  await page.waitForTimeout(350);
  const card=page.locator('.works-slider').first().locator('.swiper-slide').nth(2).locator('.image-button');
  await card.click();await page.waitForTimeout(500);
  const before=await page.evaluate(()=>({y:scrollY,x:document.querySelector('.works-slider').swiper.translate,index:document.querySelector('.works-slider').swiper.activeIndex}));
  await page.locator('.viewer-close').click();await page.waitForTimeout(600);
  const after=await page.evaluate(()=>({y:scrollY,x:document.querySelector('.works-slider').swiper.translate,index:document.querySelector('.works-slider').swiper.activeIndex}));
  assert.ok(Math.abs(before.y-after.y)<2,`Scroll stable: ${JSON.stringify({before,after})}`);assert.equal(after.index,before.index);assert.ok(Math.abs(after.x-before.x)<2);
  assert.deepEqual(errors,[]);console.log(mode,{initialRequests:frames.length,scrollStable:true});await context.close();
 }
}finally{await browser.close()}
