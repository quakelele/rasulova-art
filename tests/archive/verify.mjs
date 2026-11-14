import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const out='scrollcraft/lab';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
for(const [name,width,height,reducedMotion] of [['desktop',1440,1000,'no-preference'],['mobile',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',1440,1000,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion,acceptDownloads:true});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>Promise.reject(new Error('Disabled for verification'));Element.prototype.setPointerCapture=()=>{};Element.prototype.releasePointerCapture=()=>{};Document.prototype.exitPointerLock=()=>{}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VERIFY_URL||'http://127.0.0.1:5173',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.work').count(),6);
 const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(sizes.scroll<=sizes.width,`${name}: horizontal overflow`);
 for(const [label,selector] of [['opening','.hero'],['pause','.statement'],['collection','#collection'],['atelier','#atelier'],['ending','#inquiry']]){
  if(label==='opening'){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}))}else{await page.locator(selector).scrollIntoViewIfNeeded();}await page.waitForTimeout(900);await page.screenshot({path:`${out}/${name}-${label}.png`});
 }
 await page.getByRole('button',{name:'Вазы',exact:true}).click();assert.equal(await page.locator('.work').count(),1);
 await page.getByRole('button',{name:'Блюда',exact:true}).click();assert.equal(await page.locator('.work').count(),5);
 await page.getByRole('button',{name:/Все объекты/}).click();assert.equal(await page.locator('.work').count(),6);
 await page.getByRole('button',{name:'В подборку: Ягодный рельеф',exact:true}).click();
 await page.getByRole('button',{name:'В подборку: Солнечный круг',exact:true}).click();
 assert.equal(await page.locator('.shelf>button').count(),2);
 await page.locator('.exhibition').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/${name}-selection.png`});
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.shelf>button').count(),2);
 await page.getByRole('button',{name:'Рассмотреть: Ягодный рельеф',exact:true}).click();assert.ok(await page.locator('dialog').evaluate(e=>e.open));
 await page.screenshot({path:`${out}/${name}-dialog.png`});await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'Сохранить подборку',exact:true}).click();const download=await dl;await download.saveAs(`${out}/${name}-selection.txt`);
 const content=fs.readFileSync(`${out}/${name}-selection.txt`,'utf8');assert.ok(content.includes('Ягодный рельеф')&&content.includes('Солнечный круг'));
 if(width<650){await page.locator('.menu-toggle').click();assert.ok(await page.locator('.navigation').isVisible());await page.locator('.navigation a').first().click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false')}
 const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);assert.deepEqual(errors,[]);
 results.push({name,viewport:`${width}x${height}`,overflow:false,filters:true,persistence:true,dialog:true,download:true,brokenImages:broken,errors});await context.close();
}
fs.writeFileSync(`${out}/interaction-results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}


