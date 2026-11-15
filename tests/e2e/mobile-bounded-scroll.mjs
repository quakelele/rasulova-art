import assert from 'node:assert/strict';import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [width,height] of [[412,915],[360,640]]){
const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3});await context.addInitScript(()=>{Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{}});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173');await page.locator('#startup-loader').waitFor({state:'detached',timeout:60000});const cdp=await context.newCDPSession(page);
async function drag(x,y,dx,dy,steps=3){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps}]});await page.waitForTimeout(8)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
for(const selector of ['.statement','.catalog-category','.collection-selection','#inquiry'])for(const dir of [1,-1]){
await page.locator(selector).first().evaluate(e=>{let y=0;for(let n=e;n;n=n.offsetParent)y+=n.offsetTop;scrollTo({top:y-document.querySelector('.header').offsetHeight+120,behavior:'instant'})});await page.waitForTimeout(300);
const start=await page.evaluate(()=>scrollY);await drag(width/2,height-150,0,-dir*160);await page.waitForTimeout(50);const end=await page.evaluate(()=>scrollY);await page.waitForTimeout(1500);const settled=await page.evaluate(()=>scrollY);
assert.ok(Math.abs(settled-end)<2,`${selector}: no movement after finger release`);assert.ok(Math.abs(end-start)<=165,`${selector}: no amplified fast fling (${end-start})`);assert.ok(Math.abs(end-start)>70,`${selector}: gesture scrolls the document`);
}
await page.locator('.catalog-category').first().evaluate(e=>{let y=0;for(let n=e;n;n=n.offsetParent)y+=n.offsetTop;scrollTo({top:y-document.querySelector('.header').offsetHeight,behavior:'instant'})});await page.waitForTimeout(350);
const slider=page.locator('.works-slider').first(),box=await slider.boundingBox();const before=await slider.evaluate(e=>e.swiper.translate);await drag(width*.8,Math.max(120,Math.min(height-130,box.y+box.height/2)),-180,0,12);await page.waitForTimeout(800);assert.notEqual(await slider.evaluate(e=>e.swiper.translate),before,'Horizontal gallery still swipes');assert.deepEqual(errors,[]);console.log(width,{fastFlingBounded:true,stopsWithFinger:true,horizontalGallery:true});await context.close();
}}finally{await browser.close()}
