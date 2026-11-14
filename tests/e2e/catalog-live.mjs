import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const workspace=process.cwd(),fixture=path.resolve('public/catalog/99-Проверка автокаталога'),destination=path.resolve('artifacts/qa/live-fixture-'+Date.now());
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 assert.ok(fixture.startsWith(workspace+path.sep)&&destination.startsWith(workspace+path.sep));assert.ok(!fs.existsSync(fixture));
 fs.mkdirSync(fixture,{recursive:true});const source=fs.readdirSync('public/media/images')[0];fs.copyFileSync(path.join('public/media/images',source),path.join(fixture,'Тихое утро.jpg'));
 await page.waitForFunction(()=>[...document.querySelectorAll('.work h3')].some(e=>e.textContent==='Тихое утро'),{},{timeout:15000});
 assert.ok(await page.getByRole('heading',{name:'Проверка автокаталога',exact:true}).count());
 fs.renameSync(path.join(fixture,'Тихое утро.jpg'),path.join(fixture,'Морской свет.jpg'));
 await page.waitForFunction(()=>[...document.querySelectorAll('.work h3')].some(e=>e.textContent==='Морской свет'),{},{timeout:15000});
 const newCard=page.locator('[data-category=custom] .work');await newCard.locator('.work-add').click();
 assert.ok(new URL(await page.locator('.whatsapp-button').getAttribute('href')).searchParams.get('text').includes('Морской свет'));
 await newCard.locator('.image-button').click();await page.waitForTimeout(500);assert.equal(await page.locator('.viewer-info h2').innerText(),'Морской свет');await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
 const reveal=page.locator('.statement>p');
 const bounds=await reveal.evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight}));
 const animated=async()=>reveal.evaluate(e=>e.classList.contains('aos-animate'));
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top-300);await page.waitForTimeout(900);assert.ok(await animated());
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top+bounds.height+300);await page.waitForTimeout(900);assert.equal(await animated(),false);
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top-300);await page.waitForTimeout(900);assert.ok(await animated());
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top-1300);await page.waitForTimeout(900);assert.equal(await animated(),false);
 await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),bounds.top-300);await page.waitForTimeout(900);assert.ok(await animated());
 await page.locator('[data-category=paintings]').scrollIntoViewIfNeeded();await page.waitForTimeout(900);await page.screenshot({path:'artifacts/qa/catalog-release/empty-paintings.png'});
 await page.locator('[data-category=decor]').scrollIntoViewIfNeeded();await page.waitForTimeout(900);await page.screenshot({path:'artifacts/qa/catalog-release/decor.png'});
 console.log('AOS leave/re-enter in both scroll directions passed.');
 console.log('Live folder creation, automatic title and rename passed.');
}finally{
 if(fs.existsSync(fixture)){fs.mkdirSync(path.dirname(destination),{recursive:true});fs.renameSync(fixture,destination)}
 await browser.close();
}
