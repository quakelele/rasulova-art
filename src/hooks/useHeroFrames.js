import {useEffect} from 'react';
import {decodeFrame} from '../lib/decode-frame';
import {HERO_LAST_FRAME} from '../lib/hero-timeline';
const clamp=n=>Math.max(0,Math.min(1,n));
const base='/media/hero-last';
export default function useHeroFrames(section,canvas,windowRef,enabled){
 useEffect(()=>{
  if(!enabled)return;
  const host=section.current,el=canvas.current,win=windowRef.current,ctx=el.getContext('2d',{alpha:false,desynchronized:true});
  if(!ctx)return;
  const copy=host.querySelector('.film-copy'),beats=[...host.querySelectorAll('[data-film-beat]')];
  const abort=new AbortController(),blobs=new Map(),decoded=new Map(),pending=new Set();
  const mobile=matchMedia('(pointer:coarse),(max-width:700px)').matches,limit=mobile?12:20;
  let dead=false,ready=false,count=HERO_LAST_FRAME+1,raf=0,top=0,travel=1,target=0,cursor=0,lastTime=0,visible=true,finished=false,announced=false,direction=1,drawn=-1;
  el.width=1920;el.height=1080;
  host.dataset.renderer='frames';host.dataset.loadedFrames='0';host.dataset.frameCount=String(count);
  function schedule(){if(!dead&&ready&&visible&&!raf&&!document.hidden)raf=requestAnimationFrame(paint)}
  function evict(){
   if(decoded.size<=limit)return;
   const center=Math.round(cursor);
   for(const i of [...decoded.keys()].sort((a,b)=>Math.abs(b-center)-Math.abs(a-center))){
    if(decoded.size<=limit)break;if(Math.abs(i-center)<=1)continue;
    decoded.get(i)?.close?.();decoded.delete(i);
   }
  }
  async function decode(i){
   if(dead||i<0||i>=count||decoded.has(i)||pending.has(i)||!blobs.has(i)||pending.size>=3)return;
   pending.add(i);
   try{const bitmap=await decodeFrame(blobs.get(i));if(dead){bitmap.close?.();return}decoded.set(i,bitmap);evict()}
   catch(error){if(!dead){host.dataset.decodeError=error.message}}
   finally{pending.delete(i);schedule()}
  }
  function warm(){
   const center=Math.round(cursor),ahead=Math.min(count-1,Math.max(0,center+direction));
   const ring=[center,ahead,center-direction];for(let n=2;ring.length<limit;n++)ring.push(center+direction*n,center-direction*n);
   for(const i of ring.slice(0,limit))decode(i);
  }
  function paint(now){
   raf=0;if(dead||!ready||!visible)return;
   const dt=Math.min(32,now-(lastTime||now-16));lastTime=now;
   const desired=target*(count-1),distance=desired-cursor;
   if(Math.abs(distance)>.001)direction=Math.sign(distance);
   const step=Math.sign(distance)*Math.min(Math.abs(distance),dt*.06);
   // Never jump to a distant cached image: wait for the adjacent full-quality frame.
   const candidate=Math.max(0,Math.min(count-1,cursor+step)),a=Math.floor(candidate),b=Math.min(count-1,a+1);
   if(decoded.has(a)&&decoded.has(b))cursor=candidate;
   warm();
   const i=Math.floor(cursor),next=Math.min(count-1,i+1),blend=cursor-i;
   if(decoded.has(i)&&decoded.has(next)&&Math.abs(drawn-cursor)>.0001){
    ctx.globalAlpha=1;ctx.drawImage(decoded.get(i),0,0,el.width,el.height);
    if(blend>.001){ctx.globalAlpha=blend;ctx.drawImage(decoded.get(next),0,0,el.width,el.height);ctx.globalAlpha=1}drawn=cursor;
   }
   const p=cursor/(count-1),intro=clamp((.18-p)/.07),values=[clamp((p-.20)/.05)*clamp((.40-p)/.04),clamp((p-.42)/.06)*clamp((.65-p)/.04),clamp((p-.67)/.06)];
   copy.style.opacity=intro;copy.style.visibility=intro<.015?'hidden':'visible';
   beats.forEach((node,n)=>{node.style.opacity=values[n];node.style.visibility=values[n]<.015?'hidden':'visible';node.style.transform=`translateY(${(1-values[n])*12}px)`});
   if(drawn>=0&&!announced){announced=true;window.dispatchEvent(new Event('hero-ready'))}
   const frame=Math.round(cursor),complete=cursor>=count-1-.001&&target>.999;
   host.dataset.frame=String(frame);host.dataset.targetFrame=String(desired);host.dataset.decodedFrames=String(decoded.size);host.dataset.sequenceComplete=String(complete);
   if(complete&&!finished)window.dispatchEvent(new Event('hero-finished'));finished=complete;
   if(Math.abs(desired-cursor)>.001||pending.size)schedule();
  }
  function update(){const y=scrollY-top;if(y<-innerHeight||y>travel+innerHeight)return;target=clamp(y/travel);schedule()}
  function resize(){const viewport=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-height'))||innerHeight;top=host.getBoundingClientRect().top+scrollY;travel=Math.max(1,host.offsetHeight-viewport);update()}
  async function fetchFrame(i){
   for(let attempt=0;attempt<3;attempt++){
    try{const r=await fetch(`${base}/frames/frame-${String(i).padStart(3,'0')}.webp`,{signal:abort.signal,cache:'force-cache'});if(!r.ok)throw Error(`Frame ${i}: HTTP ${r.status}`);const blob=await r.blob();
     // Validate every downloaded image before dismissing the loader, then release
     // its large decoded surface. Keep compressed bytes and a bounded warm ring.
     const bitmap=await decodeFrame(blob);if(dead){bitmap.close?.();return}blobs.set(i,blob);
     if(i<limit)decoded.set(i,bitmap);else bitmap.close?.();
     host.dataset.loadedFrames=String(blobs.size);window.dispatchEvent(new CustomEvent('hero-load-progress',{detail:{loaded:blobs.size,total:count}}));return;
    }catch(error){if(dead||abort.signal.aborted)throw error;if(attempt===2)throw error}
   }
  }
  async function load(){
   try{let index=0;await Promise.all(Array.from({length:6},async()=>{while(index<count&&!dead)await fetchFrame(index++)}));
    if(dead)return;ready=true;resize();cursor=target*(count-1);warm();host.classList.add('has-sequence');schedule();
    // paint announces readiness only after the first complete canvas draw.
   }catch(error){if(!dead){host.dataset.loadError=error.message;window.dispatchEvent(new CustomEvent('hero-load-error',{detail:error.message}))}}
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;update();schedule()}},{rootMargin:`-${document.querySelector('.header').offsetHeight}px 0px 0px`});observer.observe(win);
  const visibility=()=>{if(!document.hidden){lastTime=0;update()}};
  addEventListener('scroll',update,{passive:true});addEventListener('resize',resize);addEventListener('page-viewport-change',resize);document.addEventListener('visibilitychange',visibility);
  resize();load();
  return()=>{dead=true;abort.abort();cancelAnimationFrame(raf);observer.disconnect();removeEventListener('scroll',update);removeEventListener('resize',resize);removeEventListener('page-viewport-change',resize);document.removeEventListener('visibilitychange',visibility);decoded.forEach(bitmap=>bitmap.close?.());decoded.clear();blobs.clear()};
 },[section,canvas,windowRef,enabled]);
}
