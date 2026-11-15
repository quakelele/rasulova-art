import fs from 'node:fs';
import {HERO_LAST_FRAME} from '../../src/lib/hero-timeline.js';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='artifacts/qa/hero-handoff';fs.mkdirSync(out,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('public/media/hero-last/manifest.json','utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),results=[];
try{
 for(const [name,width,height,mobile] of [['desktop',1440,900,false],['phone',390,844,true],['android',412,915,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:name==='android'?3:1});
  await context.addInitScript(()=>{
   Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};
   window.__heroFinishes=[];addEventListener('hero-finished',()=>{const h=document.querySelector('.hero');window.__heroFinishes.push({frame:Number(h.dataset.frame),y:scrollY,pin:h.offsetHeight-innerHeight})});
  });
  const page=await context.newPage(),errors=[],bad=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
  const cdp=await context.newCDPSession(page);if(name==='android')await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.route('**/media/hero-last/manifest.json',async route=>{await new Promise(resolve=>setTimeout(resolve,350));await route.continue()});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.locator('.film-copy h1').waitFor({state:'attached'});
  assert.equal(await page.locator('.film-copy h1').evaluate(e=>getComputedStyle(e).opacity),'0','Copy stays hidden while loader is present');
  await page.locator('#startup-loader').waitFor({state:'detached'});
  const title=page.locator('.film-copy h1');
  await page.waitForTimeout(180);
  const entering=await title.evaluate(e=>Number(getComputedStyle(e).opacity));assert.ok(entering>0&&entering<1,`Visible entrance after loader: ${entering}`);
  await page.screenshot({path:`${out}/${name}-intro-entering.png`});
  assert.ok(await title.evaluate(e=>e.getAnimations().some(a=>a.animationName==='film-copy-enter')),'Title has its own entry animation after loader');
  await page.waitForTimeout(1100);assert.equal(await title.evaluate(e=>getComputedStyle(e).opacity),'1');
  assert.equal(await page.locator('.film-scrim,.film-trail-scrim').count(),0,'No artificial light overlays');
  await page.screenshot({path:`${out}/${name}-intro.png`});
  const pin=await page.locator('.hero').evaluate(e=>e.offsetHeight-innerHeight),statement=page.locator('.statement');
  async function align(y){await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await page.waitForTimeout(650)}
  async function swipe(y1,y2){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:y1}]});for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:y1+(y2-y1)*i/12}]});await page.waitForTimeout(24)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
  await align(pin*.55);await page.screenshot({path:`${out}/${name}-raw-frame.png`});
  await align(pin-65);
  if(mobile)await swipe(height-120,110);
  else{await page.mouse.move(width/2,height/2);for(let i=0;i<14;i++){await page.mouse.wheel(0,3000);await page.waitForTimeout(45)}}
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.exitState==='complete',null,{timeout:10000});
  const expected=await statement.evaluate(e=>e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-expected)<2,'The entire gesture ends only at the next screen');
  const events=await page.evaluate(()=>window.__heroFinishes);assert.equal(events.length,1);assert.equal(events[0].frame,HERO_LAST_FRAME);assert.ok(Math.abs(events[0].y-events[0].pin)<4,'Last frame is drawn before leaving the pin');
  await page.waitForTimeout(1600);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-expected)<2,'No delayed cascade or inertial runaway');
  await page.screenshot({path:`${out}/${name}-arrival.png`});
  // Mobile content now keeps native scrolling; desktop retains chapter snapping.
  if(mobile){
   assert.ok(pin<height*1.2,'Short mobile scrub distance');
   assert.equal(await page.locator('.hero').getAttribute('data-renderer'),'frames');
   const before=await page.evaluate(()=>scrollY);await swipe(height-120,height-240);await page.waitForTimeout(1200);
   const after=await page.evaluate(()=>scrollY);assert.ok(after>before,'Fresh swipe advances');assert.ok(Math.abs(await page.locator('.catalog-category').first().evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2,'One mobile swipe advances one chapter');
   await align(pin-200);await swipe(190,350);await page.waitForTimeout(700);
   assert.ok(await page.evaluate(()=>scrollY)<pin-280,'Can scrub backward');
   // Revisit exactly the displayed final frame; no fresh decoder callback is
   // required to leave it on the next deliberate gesture.
   await align(expected);await align(pin);await swipe(height-140,height-260);await page.waitForFunction(y=>Math.abs(scrollY-y)<2,expected,{timeout:10000});
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-expected)<2,'Can exit an already displayed final frame');
   await align(pin);await swipe(190,350);await page.waitForTimeout(700);
   assert.ok(await page.evaluate(()=>scrollY)<pin-100,'Reverse gesture leaves the final frame');
   // Interrupt the native smooth transfer halfway through. Its lock must clear.
   await align(pin-40);await swipe(height-140,height-260);
   await page.waitForTimeout(50);await page.evaluate(()=>scrollTo({top:scrollY,behavior:'instant'}));
   await page.waitForTimeout(1900);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('is-hero-handoff')),false,'Interrupted handoff cannot trap subsequent gestures');

  }else{
  // A fresh desktop gesture advances one chapter normally.
  if(mobile)await swipe(height-120,height-195);else await page.mouse.wheel(0,100);
  await page.waitForTimeout(1300);assert.ok(Math.abs(await page.locator('.catalog-category').first().evaluate(e=>e.getBoundingClientRect().top-document.querySelector('.header').offsetHeight))<2);
  // Returning to the final frame must not bounce back automatically.
  if(mobile)await swipe(190,280);else await page.mouse.wheel(0,-100);await page.waitForTimeout(1200);
  if(mobile)await swipe(190,280);else await page.mouse.wheel(0,-100);await page.waitForTimeout(1200);
  assert.ok(Math.abs(await page.evaluate(()=>scrollY)-pin)<2,'Reverse can rest on the last frame without an automatic loop');
  if(mobile)await swipe(190,390);else await page.mouse.wheel(0,-180);await page.waitForTimeout(850);
  assert.ok(await page.evaluate(()=>scrollY)<pin-100,'Can scrub backward into the video');
  }
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
  results.push({name,lastFrame:events[0].frame,automaticHandoff:true,noCascade:true,animatedIntro:true,errors,bad});console.log(results.at(-1));await context.close();
 }
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
