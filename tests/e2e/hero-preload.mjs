import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const baseURL=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const setup=()=>{Element.prototype.requestPointerLock=()=>Promise.reject(Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}};
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:412,height:915}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile});await context.addInitScript(setup);
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  let release;const gate=new Promise(resolve=>release=resolve);await page.route('**/frames/frame-122.webp',async route=>{await gate;await route.continue()});
  await page.goto(baseURL,{waitUntil:'domcontentloaded'});
  await page.locator('#startup-loader').waitFor({state:'detached',timeout:60000});
  assert.ok(Number(await page.locator('.hero').getAttribute('data-loaded-frames'))<123,'Loader opens before the delayed final frame');
  assert.equal(await page.locator('video').count(),0);
  await page.waitForFunction(()=>Number(document.querySelector('.hero').dataset.frame)>=40,null,{timeout:20000});
  assert.equal(await page.evaluate(()=>scrollY),0,'Automatic intro does not scroll the page');
  release();
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.preloadComplete==='true',null,{timeout:20000});
  assert.equal(await page.locator('.hero').getAttribute('data-loaded-frames'),'123');
  assert.equal(await page.locator('.hero').getAttribute('data-renderer'),'frames');
  assert.ok(!requests.some(url=>/\.mp4(?:\?|$)/.test(url)));
  assert.deepEqual(await page.locator('.film-canvas').evaluate(e=>[e.width,e.height]),[1920,1080]);
  const framesBefore=requests.filter(url=>url.includes('/hero-last/frames/')).length;await context.setOffline(true);
  await page.evaluate(()=>scrollTo({top:document.querySelector('.hero').offsetHeight-innerHeight,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.sequenceComplete==='true',null,{timeout:20000});await page.waitForTimeout(1800);
  assert.equal(await page.locator('.hero').getAttribute('data-frame'),'122');assert.ok(Number(await page.locator('.hero').getAttribute('data-decoded-frames'))<=(mobile?12:20));
  await page.evaluate(()=>scrollTo({top:(document.querySelector('.hero').offsetHeight-innerHeight)*.35,behavior:'instant'}));
  await page.waitForFunction(()=>Math.abs(Number(document.querySelector('.hero').dataset.frame)-69)<2,null,{timeout:20000});
  assert.equal(requests.filter(url=>url.includes('/hero-last/frames/')).length,framesBefore,'No network fetches while playing forward or backward');assert.deepEqual(errors,[]);
  console.log(mobile?'phone':'desktop',{progressiveStartup:true,automaticIntro:true,offlineBothDirections:true,noMP4:true,sourceResolution:true,boundedDecodedMemory:true});await context.close();
 }
 const context=await browser.newContext();await context.addInitScript(setup);const page=await context.newPage();let attempts=0;
 await page.route('**/frames/frame-020.webp',route=>{attempts++;return route.fulfill({status:503,body:'Unavailable'})});await page.goto(baseURL,{waitUntil:'domcontentloaded'});await page.locator('#startup-loader button').waitFor({timeout:20000});assert.equal(attempts,3);assert.equal(await page.locator('#startup-loader').count(),1);assert.equal(await page.locator('.hero.has-sequence').count(),0);console.log('Missing frame: retries and explicit retry action, no partial-page reveal');await context.close();
}finally{await browser.close()}
