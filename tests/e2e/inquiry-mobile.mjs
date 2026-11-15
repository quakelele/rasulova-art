import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright-core';
const out='artifacts/qa/inquiry-mobile';fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const [name,width,height] of [['phone',390,844],['compact',360,640]]){
 const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.locator('#startup-loader').waitFor({state:'detached'});
 await page.locator('#inquiry').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:'instant'}));await page.waitForTimeout(400);
 const desk=page.locator('.inquiry-desk');assert.equal(await desk.evaluate(e=>getComputedStyle(e).overflowY),'visible');assert.ok(await desk.evaluate(e=>e.scrollHeight<=e.clientHeight+2));
 const cdp=await context.newCDPSession(page);
 async function swipe(y1,y2){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:y1}]});for(let i=1;i<=18;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:y1+(y2-y1)*i/18}]});await page.waitForTimeout(25)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(700)}
 const before=await page.evaluate(()=>scrollY);await swipe(height-100,Math.max(150,height-350));assert.ok(await page.evaluate(()=>scrollY)>before+100,'Dragging from inside the card scrolls the page');assert.equal(await desk.evaluate(e=>e.scrollTop),0);
 await page.screenshot({path:`${out}/${name}-actions.png`});
 let button=await page.locator('.whatsapp-button').boundingBox();for(let i=0;i<5&&button.y+button.height>height-20;i++){await swipe(height-110,height-270);button=await page.locator('.whatsapp-button').boundingBox()}
 assert.ok(button.y>=78&&button.y+button.height<=height,'WhatsApp action reached through page scrolling');assert.ok(await page.locator('.copy-inquiry').isVisible());
 const after=await page.evaluate(()=>scrollY);await swipe(height-130,180);assert.ok(await page.evaluate(()=>scrollY)>after+100,'Dragging the lower form continues toward contacts');
 assert.deepEqual(errors,[]);console.log(name,{singlePageScroll:true,actionsReachable:true,canContinue:true,errors});await context.close();
 }
 const p=await browser.newPage();let debugLoaded=false;p.on('request',r=>{if(r.url().includes('/scroll-diagnostics-'))debugLoaded=true});await p.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});assert.equal(debugLoaded,false);await p.goto('http://127.0.0.1:4173/?scrollDebug=1',{waitUntil:'networkidle'});await p.getByRole('complementary',{name:'Диагностика прокрутки'}).waitFor();assert.equal(debugLoaded,true);await p.getByRole('button',{name:'Закрыть',exact:true}).click();await p.goto('http://127.0.0.1:4173/device-diag.html');assert.ok(await p.getByRole('heading',{name:'Проверка на телефоне'}).isVisible());console.log('Diagnostic is opt-in and real-device page is available');await p.close();
}finally{await browser.close()}
