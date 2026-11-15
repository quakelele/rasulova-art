import {decodeFrame} from '../lib/decode-frame';
import {useEffect} from 'react';
import {useReducedMotion,useSpring} from 'framer-motion';
const clamp=n=>Math.max(0,Math.min(1,n));

// Decode only a small window; compressed frames start loading near this scene.
export default function useFrameSequence(section,canvas,basePath='/media/interior-sequence',mode='pin'){
 const reduced=useReducedMotion();
 const progress=useSpring(0,{stiffness:210,damping:30,mass:.55,restDelta:.00015,restSpeed:.00015});
 useEffect(()=>{
  if(reduced!==false)return;
  const host=section.current,el=canvas.current,ctx=el.getContext('2d',{alpha:false,desynchronized:true});if(!ctx)return;
  const abort=new AbortController(),blobs=new Map(),decoded=new Map(),decoding=new Set(),fetching=new Set(),failed=new Set();
  const mobile=matchMedia('(max-width:650px)').matches,limit=mobile?12:24;
  let count=0,queue=[],workers=0,dead=false,raf=0,top=0,travel=1,near=false,visible=false,started=false;
  const framePath=i=>`${basePath}/${mobile?'mobile':'desktop'}/frame-${String(i).padStart(3,'0')}.webp`;
  const schedule=()=>{if(!dead&&!raf&&visible&&!document.hidden)raf=requestAnimationFrame(paint)};
  function evict(){const center=clamp(progress.get())*(count-1);while(decoded.size>limit){const i=[...decoded.keys()].sort((a,b)=>Math.abs(b-center)-Math.abs(a-center))[0];decoded.get(i)?.close?.();decoded.delete(i)}}
  async function decode(i){
   if(dead||!blobs.has(i)||decoded.has(i)||decoding.has(i)||decoding.size>=3)return;
   decoding.add(i);
   try{
    const bitmap=await decodeFrame(blobs.get(i));
    if(dead||(!near&&mode==='flow')){bitmap.close?.();return}decoded.set(i,bitmap);evict();schedule();
   }catch{/* The poster or last complete frame remains visible. */}finally{decoding.delete(i)}
  }
  function pump(){while(!dead&&near&&workers<4&&queue.length){const i=queue.shift();if(blobs.has(i)||fetching.has(i)||failed.has(i))continue;workers++;fetching.add(i);fetch(framePath(i),{signal:abort.signal,cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.blob()}).then(blob=>{if(dead)return;blobs.set(i,blob);if(Math.abs(i-clamp(progress.get())*(count-1))<4)decode(i)}).catch(()=>{if(!dead)failed.add(i)}).finally(()=>{workers--;fetching.delete(i);if(!dead){pump();schedule()}})}}
  function prioritize(i){for(const n of [i+3,i+2,i-1,i+1,i]){if(n<0||n>=count)continue;if(blobs.has(n)){decode(n);continue}if(failed.has(n)||fetching.has(n))continue;const at=queue.indexOf(n);if(at>=0)queue.splice(at,1);queue.unshift(n)}pump()}
  function draw(bitmap,alpha){const scale=Math.min(el.width/bitmap.width,el.height/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;ctx.globalAlpha=alpha;ctx.drawImage(bitmap,(el.width-w)/2,(el.height-h)/2,w,h)}
  function paint(){
   raf=0;if(dead||!count)return;const p=clamp(progress.get()),f=p*(count-1),i=Math.floor(f),next=Math.min(count-1,i+1);prioritize(i);
   host.style.setProperty('--interior-progress',p.toFixed(5));
   host.style.setProperty('--interior-first',clamp((.54-p)/.14).toFixed(5));
   host.style.setProperty('--interior-second',clamp((p-.43)/.16).toFixed(5));
   let nearest=i;if(!decoded.has(nearest))nearest=[...decoded.keys()].sort((a,b)=>Math.abs(a-f)-Math.abs(b-f))[0];
   if(nearest===undefined)return;
   ctx.globalAlpha=1;ctx.fillStyle='#eeeae0';ctx.fillRect(0,0,el.width,el.height);draw(decoded.get(nearest),1);
   if(nearest===i&&decoded.has(next)&&f-i>.001)draw(decoded.get(next),f-i);ctx.globalAlpha=1;
   host.classList.add('interior-ready');host.dataset.frame=String(nearest);host.dataset.decodedFrames=String(decoded.size);host.dataset.sequenceComplete=String(nearest===count-1&&p>.999);
  }
  function currentProgress(){return clamp(mode==='flow'?(scrollY+innerHeight-top)/(host.offsetHeight+innerHeight):(scrollY-top)/travel)}
  function update(){progress.set(currentProgress());schedule()}
  function resize(){const box=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.25);el.width=Math.max(1,Math.round(box.width*dpr));el.height=Math.max(1,Math.round(box.height*dpr));top=host.getBoundingClientRect().top+scrollY;travel=Math.max(1,(host.offsetHeight-innerHeight)*.88);update();schedule()}
  async function start(){if(started)return;started=true;try{const response=await fetch(`${basePath}/manifest.json`,{signal:abort.signal});if(!response.ok)throw Error(response.status);const manifest=await response.json();if(dead)return;count=manifest.count;queue=[];resize();progress.jump(currentProgress());prioritize(Math.floor(clamp(progress.get())*(count-1)))}catch{/* Static poster fallback. */}}
  const preload=new IntersectionObserver(entries=>{near=entries[0].isIntersecting;if(near){start();if(count)prioritize(Math.floor(clamp(progress.get())*(count-1)));pump()}else if(mode==='flow'&&started){decoded.forEach(bitmap=>bitmap.close?.());decoded.clear();blobs.clear();queue=[]}},{rootMargin:'700px'});
  const visibility=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){update();schedule()}});
  preload.observe(host);visibility.observe(host);
  const unsubscribe=progress.on('change',schedule),sizing=new ResizeObserver(resize);sizing.observe(host);sizing.observe(el);
  const wake=()=>{if(!document.hidden){update();schedule()}};
  addEventListener('scroll',update,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',wake);resize();
  return()=>{dead=true;abort.abort();preload.disconnect();visibility.disconnect();sizing.disconnect();unsubscribe();removeEventListener('scroll',update);removeEventListener('resize',resize);document.removeEventListener('visibilitychange',wake);cancelAnimationFrame(raf);decoded.forEach(bitmap=>bitmap.close?.());decoded.clear();blobs.clear()};
 },[reduced,progress,section,canvas,basePath,mode]);
}
