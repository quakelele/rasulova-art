import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='artifacts/qa/mobile-sections';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const [name,width,height] of [['phone',390,844],['compact',360,640],['large-phone',430,932]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
  const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
  const cdp=await context.newCDPSession(page);
  async function swipe(x1,y1,x2,y2,steps=12){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
   for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/steps,y:y1+(y2-y1)*i/steps}]});await page.waitForTimeout(18)}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1200);
  }
  const statement=page.locator('.statement'),decor=page.locator('.catalog-category').first();
  await statement.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(300);
  await swipe(width/2,height-100,width/2,140,7);
  assert.ok(Math.abs(await decor.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'Long fast swipe advances exactly one chapter');
  assert.equal(await page.locator('.premium-viewer').evaluate(e=>e.open),false);
  await page.screenshot({path:`${out}/${name}.png`});
  const box=await decor.locator('.image-button').first().boundingBox(),y=box.y+Math.min(80,box.height/2),beforeHorizontal=await page.evaluate(()=>scrollY);
  await swipe(width-50,y,50,y,14);assert.ok(await decor.locator('.works-slider').evaluate(e=>e.swiper.activeIndex)>0);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-beforeHorizontal)<2,'Horizontal gallery swipe leaves page still');
  // Reverse input at a section start is a page gesture even on a compact phone.
  await swipe(width/2,200,width/2,height-100);
  assert.ok(Math.abs(await statement.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'Swipe back reaches prior chapter');
  // A short deliberate swipe should not need half a viewport of native travel.
  await swipe(width/2,450,width/2,390,8);
  assert.ok(Math.abs(await decor.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'60px swipe advances a section');
  const sections=page.locator('.catalog-category,.collection-archive,.collection-selection,.atelier');
  let checked=0;
  for(let i=0;i<await sections.count()-1;i++){
   const current=sections.nth(i),next=sections.nth(i+1),fits=await current.evaluate(e=>e.offsetHeight<=innerHeight-document.querySelector('.header').offsetHeight+3);
   if(!fits)continue;
   await current.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(150);
   await swipe(width/2,height-100,width/2,height-170,8);
   assert.ok(Math.abs(await next.evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'Each short swipe reaches the next chapter');checked++;
  }
  if(name==='compact'){
   await page.locator('#inquiry').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(900);
   const panel=page.locator('.inquiry-desk'),rect=await panel.boundingBox(),pageBefore=await page.evaluate(()=>scrollY);
   await swipe(rect.x+rect.width/2,rect.y+rect.height-35,rect.x+rect.width/2,rect.y+45,12);
   assert.ok(await panel.evaluate(e=>e.scrollTop)>40,'Nested selection panel still scrolls');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-pageBefore)<2);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log({name,checked,longSwipe:true,shortSwipe:true,horizontal:true,reverse:true,errors,bad});await context.close();
 }
}finally{await browser.close()}
