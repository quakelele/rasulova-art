import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const out='artifacts/qa/second-film';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{for(const [name,width,height,reducedMotion]of[['desktop',1440,1000,'no-preference'],['phone',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',1440,1000,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion}),page=await context.newPage(),errors=[],bad=[];let framesRequested=0;
 page.on('pageerror',error=>errors.push(error.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});page.on('request',r=>{if(r.url().includes('/interior-sequence/')&&r.url().includes('/frame-'))framesRequested++});
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});assert.equal(framesRequested,0,'Second scene should not download frames at page entry');
 const section=page.locator('#interior-scene');assert.equal(await section.count(),1);let frames=[];
 if(reducedMotion!=='reduce'){
  const geometry=await section.evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,travel:e.offsetHeight-innerHeight}));
  for(const [label,p]of[['start',0],['middle',.48],['end',.98],['reverse',.2]]){
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+geometry.travel*p);
   await page.waitForFunction(()=>document.querySelector('#interior-scene').classList.contains('interior-ready'));
   await page.waitForTimeout(1200);const frame=Number(await section.getAttribute('data-frame'));frames.push(frame);
   const image=await page.locator('.interior-image').boundingBox();assert.ok(image.y>=70&&image.y+image.height<=height,'Full portrait must fit below the header');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`${out}/${name}-${label}.png`});
  }
  assert.ok(frames[0]<5&&frames[1]>70&&frames[2]>280&&frames[3]<90,`Forward and backward timeline: ${frames}`);
  assert.equal(await section.getAttribute('data-sequence-complete'),'false');
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+geometry.travel*.98);await page.waitForFunction(()=>document.querySelector('#interior-scene').dataset.sequenceComplete==='true');
  assert.ok(await page.locator('.interior-stage').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<2),'Last frame completes while pinned');
  assert.ok(await page.locator('#inquiry').evaluate(e=>e.getBoundingClientRect().top>=innerHeight),'Inquiry follows the complete scene');
  await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+geometry.travel+150);await page.waitForTimeout(200);assert.ok(await page.locator('.interior-stage').evaluate(e=>e.getBoundingClientRect().top<-100));
 }else{await section.scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}.png`});assert.equal(framesRequested,0);assert.equal(await page.locator('.interior-image canvas').isVisible(),false)}
 for(const[lang,label]of[['en','English'],['az','Azərbaycan dili'],['ru','Русский']]){await page.getByRole('button',{name:label,exact:true}).click();assert.equal(await page.locator('html').getAttribute('lang'),lang);assert.ok(!(await section.innerText()).includes('undefined'))}
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);results.push({name,frames,framesRequested,errors,bad});console.log(results.at(-1));await context.close();
}
 const off=await browser.newPage();await off.goto('http://127.0.0.1:4173/?interior=off',{waitUntil:'networkidle'});assert.equal(await off.locator('#interior-scene').count(),0);assert.equal(await off.locator('.hero.film').count(),1);await off.close();
 fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}
