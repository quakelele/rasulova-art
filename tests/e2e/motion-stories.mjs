import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {motionStories} from '../../src/data/motion-stories.js';
const out='artifacts/qa/motion-stories';fs.mkdirSync(out,{recursive:true});
const clips=Object.values(motionStories).flatMap(story=>story.clips),browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),results=[];
try{for(const[name,width,height,reducedMotion]of[['desktop',1440,1000,'no-preference'],['tablet',768,1024,'no-preference'],['phone',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',1440,1000,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion}),page=await context.newPage(),errors=[],bad=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});page.on('request',r=>{if(r.url().includes('/media/stories/')&&r.url().includes('/frame-'))requests.push(r.url())});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(requests.length,0,'Do not fetch the four sequences at page entry');assert.equal(await page.locator('[data-motion-clip]').count(),4);
 const observed=[];
 for(const clip of clips){
  const element=page.locator(`[data-motion-clip="${clip.id}"]`),manifest=JSON.parse(fs.readFileSync(`public/media/stories/${clip.id}/manifest.json`,'utf8'));
  const geometry=await element.evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight})),frames=[];
  if(reducedMotion!=='reduce'){
   for(const p of [.3,.55,.75,.35]){
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top-height+(geometry.height+height)*p);
    await page.waitForFunction(({id,target})=>Math.abs(Number(document.querySelector(`[data-motion-clip="${id}"]`).dataset.frame)-target)<6,{id:clip.id,target:(manifest.count-1)*p},{timeout:15000});
    frames.push(Number(await element.getAttribute('data-frame')));await page.waitForTimeout(150);
   }
   assert.ok(frames[0]<frames[1]&&frames[1]<frames[2]&&frames[3]<frames[2]);assert.ok(Number(await element.getAttribute('data-decoded-frames'))<=(width<=650?12:24));
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top-height+(geometry.height+height)*.5);await page.waitForTimeout(900);
  }else{await element.scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal(await element.locator('canvas').isVisible(),false)}
  assert.equal(await element.locator('img').evaluate(i=>i.naturalWidth>0),true);assert.equal(await element.locator('img').evaluate(i=>getComputedStyle(i).objectFit),'contain');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${out}/${name}-${clip.id}.png`});observed.push({id:clip.id,frames});
 }
 if(reducedMotion!=='reduce'){
  // Return after its buffers were released, using the browser's HTTP cache.
  const first=page.locator('[data-motion-clip=hydrangea]');await first.scrollIntoViewIfNeeded();await page.waitForTimeout(1100);assert.ok(Number(await first.getAttribute('data-decoded-frames'))>0);
 }else assert.equal(requests.length,0);
 for(const[lang,label]of[['en','English'],['az','Azərbaycan dili'],['ru','Русский']]){await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(100);assert.equal(await page.locator('#story-color h2').innerText(),motionStories.color[lang].title+'\n'+motionStories.color[lang].accent);assert.equal(await page.locator('.story-white-bowl figcaption').innerText(),clips.at(-1)[lang])}
 assert.equal(await page.locator('#story-color').evaluate(e=>e.getBoundingClientRect().height>0),true);assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);results.push({name,observed,requested:requests.length,errors,bad});console.log(results.at(-1));await context.close();
}
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173/?stories=off',{waitUntil:'networkidle'});assert.equal(await page.locator('[data-motion-clip]').count(),0);assert.equal(await page.locator('#interior-scene').count(),1);assert.equal(await page.locator('.hero.film').count(),1);await page.close();
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
