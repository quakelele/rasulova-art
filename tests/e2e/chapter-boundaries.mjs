import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 for(const [width,height] of [[1900,933],[1280,600],[390,749],[360,640]]){
  const mobile=width<700,page=await browser.newPage({viewport:{width,height},isMobile:mobile,hasTouch:mobile});
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:4173');
  await page.locator('#startup-loader').waitFor({state:'detached',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('.hero').dataset.sequenceComplete==='true',null,{timeout:30000});
  const layout=await page.evaluate(()=>{
   const top=e=>{let y=0;for(let n=e;n;n=n.offsetParent)y+=n.offsetTop;return y};
   const header=document.querySelector('.header').offsetHeight;
   const sections=[...document.querySelectorAll('.statement,.catalog-category,.collection-archive,.collection-selection,.atelier,.selection-inquiry,.contacts-section')].map(e=>{
    const start=top(e)-header,physicalEnd=Math.max(start,top(e)+e.offsetHeight-innerHeight);
    return {name:e.querySelector('h2')?.innerText||e.className,start,end:start+(physicalEnd-start)*(Number(e.dataset.scrollCompleteAt)||1),tall:e.offsetHeight>innerHeight-header+3,free:e.matches('.selection-inquiry')};
   });
   const limit=document.documentElement.scrollHeight-innerHeight;
   const points=[...new Set([document.querySelector('.hero').offsetHeight-innerHeight,...sections.flatMap(s=>s.tall?[s.start,s.end]:[s.start]),limit].map(y=>Math.round(Math.max(0,Math.min(y,limit)))))].sort((a,b)=>a-b);
   return {sections,points};
  });
  const cdp=await page.context().newCDPSession(page);
  async function gesture(dir){
   if(mobile){
    const y=dir>0?height-140:190;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.45,y}]});
    for(let i=1;i<=6;i++){
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.45,y:y-dir*i*20}]});
     await page.waitForTimeout(15);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{await page.mouse.move(20,height/2);await page.mouse.wheel(0,dir*180)}
   await page.waitForTimeout(1150);
  }
  for(const section of layout.sections.filter(s=>s.tall&&!s.free&&s.end-s.start>6)){
   for(const dir of [1,-1]){
    const boundary=dir>0?section.end:section.start;
    const origin=dir>0?boundary-20:boundary+20;
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),origin);await page.waitForTimeout(150);
    await gesture(dir);
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-boundary)<2,`${width} ${section.name}: gesture clamps to ${boundary}`);
    const destination=dir>0?layout.points.find(p=>p>boundary+4):layout.points.findLast(p=>p<boundary-4);
    if(destination!==undefined){
     await gesture(dir);
     assert.ok(Math.abs(await page.evaluate(()=>scrollY)-destination)<2,`${width} ${section.name}: next gesture reaches ${destination}`);
    }
    console.log(width,section.name.replaceAll('\n',' '),dir,{clamped:true,nextSection:true});
   }
  }
  {
   const section=layout.sections[0];
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),section.end-30);await page.waitForTimeout(150);
   if(mobile){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.45,y:height-140}]});
    for(let step=1;step<=3;step++){
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.45,y:height-140-step*8}]});
     await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else await page.mouse.wheel(0,15);
   await page.waitForTimeout(1100);
   assert.equal(await page.locator('.statement').evaluate(e=>Number(e.style.getPropertyValue('--joiner-progress'))),1,'Near-complete mosaic settles to exactly 100 percent');
   const offsets=await page.locator('.joiner-piece').evaluateAll(es=>es.map(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return Math.hypot(m.m41,m.m42)}));
   assert.ok(offsets.every(offset=>offset<.02),'All tiles finish with the progress bar');
   await gesture(1);
   const next=layout.points.find(point=>point>section.end+4);
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-next)<2,'Next gesture leaves the completed mosaic');
   console.log(width,'near-complete mosaic settles to 100 percent and exits on next gesture');
  }
  if(!mobile){
   const section=layout.sections[0];
   await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),section.end-20);await page.waitForTimeout(150);
   for(let i=0;i<5;i++){await page.mouse.wheel(0,60);await page.waitForTimeout(30)}
   await page.waitForTimeout(1000);
   assert.ok(Math.abs(await page.evaluate(()=>scrollY)-section.end)<2,'A continuous wheel burst stays on the reached boundary');
   console.log(width,'continuous wheel burst clamped');
  }
  await page.close();
 }
}finally{await browser.close()}
