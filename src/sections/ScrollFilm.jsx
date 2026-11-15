import {decodeFrame} from '../lib/decode-frame';
import React,{useEffect,useRef} from 'react';
import {useReducedMotion,useSpring} from 'framer-motion';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';

const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));

export default function ScrollFilm(){
 const section=useRef(null),canvas=useRef(null),windowRef=useRef(null);
 const reduced=useReducedMotion(); const {t}=useLocale();
 const progress=useSpring(0,{stiffness:210,damping:30,mass:.55,restDelta:.00015,restSpeed:.00015});
 useEffect(()=>{
  if(reduced!==false)return;
  const host=section.current,el=canvas.current,frameWindow=windowRef.current;
  const ctx=el.getContext('2d',{alpha:false,desynchronized:true});
  if(!ctx)return;
  const copy=host.querySelector('.film-copy'),beatNodes=[...host.querySelectorAll('[data-film-beat]')];
  const abort=new AbortController(),blobs=new Map(),decoded=new Map(),decoding=new Set(),fetching=new Set(),failed=new Set();
  const mobile=matchMedia('(max-width: 700px)').matches,cacheLimit=mobile?18:32;
  let count=0,queue=[],workers=0,dead=false,raf=0,top=0,travel=1,visible=true,previous=-1;
  const framePath=i=>`/media/sequence/${mobile?'mobile':'desktop'}/frame-${String(i).padStart(3,'0')}.webp`;
  const schedule=()=>{if(!dead&&!raf&&visible&&!document.hidden)raf=requestAnimationFrame(paint)};
  const evict=()=>{const center=(1-clamp(progress.get()))*(count-1);while(decoded.size>cacheLimit){const key=[...decoded.keys()].sort((a,b)=>Math.abs(b-center)-Math.abs(a-center))[0];decoded.get(key)?.close?.();decoded.delete(key)}};
  async function decode(i){
   if(dead||!blobs.has(i)||decoded.has(i)||decoding.has(i)||decoding.size>=4)return;
   decoding.add(i);
   try{const bitmap=await decodeFrame(blobs.get(i));
    if(dead){bitmap.close?.();return}decoded.set(i,bitmap);evict();schedule();
   }catch{/* Retain the last complete frame if a single image cannot decode. */}finally{decoding.delete(i);if(!dead&&Math.abs(i-(1-clamp(progress.get()))*(count-1))<8)schedule()}
  }
  function pump(){while(!dead&&workers<5&&queue.length){const i=queue.shift();if(blobs.has(i)||fetching.has(i)||failed.has(i))continue;workers++;fetching.add(i);fetch(framePath(i),{signal:abort.signal,cache:'force-cache'}).then(r=>{if(!r.ok)throw Error(r.status);return r.blob()}).then(blob=>{if(dead)return;blobs.set(i,blob);const desired=(1-clamp(progress.get()))*(count-1);if(i===count-1||Math.abs(i-desired)<5)decode(i)}).catch(()=>{if(!dead)failed.add(i)}).finally(()=>{workers--;fetching.delete(i);if(!dead){pump();schedule()}})}}
  function prioritize(i){for(const n of [i,i+1,i-1,i+2,i-2,i+3]){if(n<0||n>=count)continue;if(blobs.has(n)){decode(n);continue}if(failed.has(n)||fetching.has(n))continue;const at=queue.indexOf(n);if(at>=0)queue.splice(at,1);queue.unshift(n)}pump()}
  function draw(bitmap,alpha){const scale=Math.max(el.width/bitmap.width,el.height/bitmap.height),w=bitmap.width*scale,h=bitmap.height*scale;ctx.globalAlpha=alpha;ctx.drawImage(bitmap,(el.width-w)/2,(el.height-h)/2,w,h)}
  function paint(){raf=0;if(dead||!count)return;const p=clamp(progress.get()),f=(1-p)*(count-1),i=Math.floor(f),next=Math.min(count-1,i+1);prioritize(i);
   frameWindow.style.setProperty('--film-progress',p.toFixed(5));
   const intro=clamp((.18-p)/.07),beats=[clamp((p-.20)/.05)*clamp((.40-p)/.04),clamp((p-.42)/.06)*clamp((.65-p)/.04),clamp((p-.67)/.06)];
   copy.style.opacity=intro;
   copy.style.visibility=intro<.015?'hidden':'visible';
   beatNodes.forEach((node,index)=>{node.style.opacity=beats[index];node.style.visibility=beats[index]<.015?'hidden':'visible';node.style.transform=`translateY(${(1-beats[index])*12}px)`});
   let nearest=i;if(!decoded.has(nearest)){nearest=[...decoded.keys()].sort((a,b)=>Math.abs(a-f)-Math.abs(b-f))[0]}
   if(nearest===undefined)return;const bitmap=decoded.get(nearest);if(!bitmap)return;
   ctx.globalAlpha=1;ctx.fillStyle='#12140f';ctx.fillRect(0,0,el.width,el.height);draw(bitmap,1);
   const blend=nearest===i&&decoded.has(next)?f-i:0;if(blend>.001)draw(decoded.get(next),blend);ctx.globalAlpha=1;
   if(!host.classList.contains('has-sequence')){host.classList.add('has-sequence');window.dispatchEvent(new Event('hero-ready'))}host.dataset.frame=String(nearest);host.dataset.decodedFrames=String(decoded.size);host.dataset.targetFrame=f.toFixed(2);host.dataset.scVerifyState=`${nearest}:${blend.toFixed(2)}:${intro.toFixed(2)}:${beats.map(n=>n.toFixed(2)).join(":")}`;host.dataset.sequenceComplete=String(nearest===0&&p>.999);host.dataset.scVerifyHold=String(nearest===0&&p>.999);
   if(previous!==i){previous=i;for(let d=1;d<5;d++){decode(i+d);decode(i-d)}}
  }
  function update(){const y=window.scrollY-top;if(y<-innerHeight||y>travel+innerHeight)return;progress.set(clamp(y/travel));schedule()}
  function resize(){
   const rect=frameWindow.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,mobile?1.5:1.25);
   const width=Math.round(rect.width*dpr),height=Math.round(rect.height*dpr),changed=el.width!==width||el.height!==height;
   if(el.width!==width)el.width=width;if(el.height!==height)el.height=height;
   const viewport=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-height'))||innerHeight;
   top=host.getBoundingClientRect().top+scrollY;travel=Math.max(1,host.offsetHeight-viewport);update();
   if(changed&&count&&visible){cancelAnimationFrame(raf);raf=0;paint()}else schedule();
  }
  const unsubscribe=progress.on('change',schedule);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){update();schedule()}},{rootMargin:'150px'});observer.observe(host);
  const onVisibility=()=>{if(!document.hidden){update();schedule()}};
  addEventListener('scroll',update,{passive:true});addEventListener('resize',resize);addEventListener('page-viewport-change',resize);document.addEventListener('visibilitychange',onVisibility);
  fetch('/media/sequence/manifest.json',{signal:abort.signal}).then(r=>r.json()).then(manifest=>{if(dead)return;count=manifest.count;queue=[];resize();progress.jump(clamp((scrollY-top)/travel));prioritize(Math.floor((1-clamp(progress.get()))*(count-1)))}).catch(()=>{});
  resize();
  return()=>{dead=true;abort.abort();unsubscribe();observer.disconnect();removeEventListener('scroll',update);removeEventListener('resize',resize);removeEventListener('page-viewport-change',resize);document.removeEventListener('visibilitychange',onVisibility);cancelAnimationFrame(raf);decoded.forEach(bitmap=>bitmap.close?.());decoded.clear();blobs.clear()};
 },[reduced,progress]);
 return <section ref={section} className="hero film sequence-film" data-sc-act="pin" data-sc-span="3.2" data-sc-verify-state="poster" aria-labelledby="hero-title"><div className="film-stage" data-sc-stage><div className="film-window" ref={windowRef}><img className="film-poster" src="/media/posters/hero.webp" alt={t('heroCaption')} fetchpriority="high"/><canvas ref={canvas} className="film-canvas" aria-hidden="true"/><div className="film-scrim"/><div className="film-trail-scrim"/><div className="film-copy"><span className="film-eyebrow">{t('heroEyebrow')}</span><h1 id="hero-title">{t('heroTitle1')}<br/><em>{t('heroTitle2')}</em></h1><p>{t('heroIntro')}</p><a className="line-link" href="#collection">{t('heroCta')} <ArrowUpRight size={20}/></a></div>{[1,2,3].map(n=><div key={n} className="film-text-beat" data-film-beat={n}><span>{t('heroEyebrow')}</span><h2>{t(`heroBeat${n}Title`)}</h2><p>{t(`heroBeat${n}Body`)}</p>{n===3&&<a className="line-link" href="#collection">{t('heroCta')} <ArrowUpRight size={18}/></a>}</div>)}<div className="film-caption"><span>{t('heroCaption')}</span><span>RASULOVA ART</span></div></div><div className="film-mat"><span>RASULOVA ART</span><span>{t('heroMat')}</span></div></div></section>
}
