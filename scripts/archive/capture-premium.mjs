import {chromium} from 'playwright-core';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [name,width,height] of [['desktop',1440,1000],['phone',390,844],['compact',360,640]]){
 const c=await b.newContext({viewport:{width,height}});await c.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject();Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};localStorage.setItem('rasulova-selection','["berry","lemon"]')});const p=await c.newPage();await p.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 await p.locator('#inquiry').evaluate(e=>scrollTo({top:e.offsetTop-100,behavior:'instant'}));await p.waitForTimeout(400);await p.screenshot({path:`scrollcraft/lab/premium/${name}-inquiry-overview.png`});
 await p.locator('.inquiry-desk').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-100,behavior:'instant'}));await p.waitForTimeout(300);await p.screenshot({path:`scrollcraft/lab/premium/${name}-previews.png`});
 await p.locator('#collection').evaluate(e=>scrollTo({top:e.offsetTop-100,behavior:'instant'}));await p.waitForTimeout(200);await p.getByRole('button',{name:/Все фотографии/}).click();await p.waitForTimeout(400);await p.screenshot({path:`scrollcraft/lab/premium/${name}-archive.png`});await c.close();
}}finally{await b.close()}
