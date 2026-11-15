import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({viewport:mobile?{width:390,height:749}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
  await page.locator('#startup-loader').waitFor({state:'detached',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.sequenceComplete==='true');
  const cdp=await page.context().newCDPSession(page);
  async function gesture(up=false){
   if(!mobile){await page.mouse.move(300,400);await page.mouse.wheel(0,up?-180:180)}
   else{
    const start=up?300:600;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:start}]});
    for(let i=1;i<=8;i++){
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y:start+(up?1:-1)*i*20}]});
     await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   await page.waitForTimeout(250);
  }
  await gesture();assert.ok(await page.evaluate(()=>scrollY)>50,'First gesture moves the hero');
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.exitState==='complete');
  const end=await page.locator('.hero').evaluate(el=>el.offsetHeight-innerHeight);
  await page.evaluate(()=>scrollTo({top:document.querySelector('.statement').offsetTop-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(150);
  const before=await page.evaluate(()=>scrollY);await gesture(true);
  await page.waitForFunction(y=>Math.abs(scrollY-y)<2,end,{timeout:7000});
  assert.ok(await page.evaluate(()=>scrollY)<before-30,'First upward gesture returns to the full hero section');
  await page.waitForTimeout(1000);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.frame==='40',null,{timeout:20000});
  console.log(mobile?'phone':'desktop',{firstGesture:true,returnAcrossHeroBoundary:true,topFrame:40});
  await page.close();
 }
}finally{await browser.close()}
