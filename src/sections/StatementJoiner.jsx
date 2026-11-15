import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';

const photo='/media/images/photo_2026-08-02_11-25-30.webp';
const tiles=Array.from({length:24},(_,index)=>({
 x:index%4,y:Math.floor(index/4),
 dx:Math.sin(index*7.13)*95+(index%4-1.5)*24,dy:Math.cos(index*4.71)*75,
 angle:Math.sin(index*2.37)*17
}));
const clamp=value=>Math.max(0,Math.min(1,value));

export default function StatementJoiner(){
 const {t}=useLocale();
 const section=useRef(null),picture=useRef(null);
 const [failed,setFailed]=useState(false);
 const [stage,setStage]=useState(0);
 useEffect(()=>{
  const host=section.current,box=picture.current;
  const pieces=[...box.querySelectorAll('.joiner-piece')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=false,pointer=null;
  function paint(){
   frame=0;
   if(!visible)return;
   const rect=host.getBoundingClientRect();
   const header=document.querySelector('.header').offsetHeight;
   const progress=reduced.matches?1:clamp((header-rect.top)/Math.max(1,host.offsetHeight-innerHeight+header));
   const amount=clamp(progress/.82);
   setStage(progress<.3?0:progress<.68?1:2);
   const loose=1-amount*amount*(3-2*amount);
   const compact=matchMedia('(max-width:700px)').matches ? .55 : 1;
   const bounds=box.getBoundingClientRect();
   pieces.forEach((piece,index)=>{
    const tile=tiles[index];
    const x=(tile.x+.5)*bounds.width/4,y=(tile.y+.5)*bounds.height/6;
    const distance=pointer?Math.hypot(x-pointer.x,y-pointer.y):Infinity;
    const influence=clamp(1-distance/180)*loose;
    const localAmount=clamp((amount-index%5*.025)/.9);
    const localLoose=1-localAmount*localAmount*(3-2*localAmount);
    const dx=tile.dx*localLoose*compact+(pointer?(x-pointer.x)*influence*.12:0);
    const dy=tile.dy*localLoose*compact+(pointer?(y-pointer.y)*influence*.12:0);
    piece.style.transform=`translate(${dx}px,${dy}px) rotate(${tile.angle*localLoose}deg) scale(${1-localLoose*.07})`;
   });
   box.style.setProperty('--joiner-scale',String(.9+amount*.14));
   host.style.setProperty('--joiner-progress',String(amount));
  }
  function schedule(){if(visible&&!frame)frame=requestAnimationFrame(paint)}
  function move(event){
   if(event.pointerType!=='mouse'||reduced.matches)return;
   const rect=box.getBoundingClientRect();
   pointer={x:event.clientX-rect.left,y:event.clientY-rect.top};schedule();
  }
  function leave(){pointer=null;schedule()}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()});
  observer.observe(host);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('page-viewport-change',schedule);
  reduced.addEventListener('change',schedule);
  box.addEventListener('pointermove',move);
  box.addEventListener('pointerleave',leave);
  return()=>{
   observer.disconnect();cancelAnimationFrame(frame);
   removeEventListener('scroll',schedule);removeEventListener('resize',schedule);
   removeEventListener('page-viewport-change',schedule);
   reduced.removeEventListener('change',schedule);
   box.removeEventListener('pointermove',move);box.removeEventListener('pointerleave',leave);
  };
 },[]);
 return <section ref={section} className={`statement statement-joiner${failed?' is-image-unavailable':''}`} data-sc-act="pin" aria-labelledby="statement-title">
  <div className="joiner-stage">
   <div className="joiner-copy">
    <span className="small-note">{t('joinerTag')}</span>
    <div className="joiner-text" key={stage}>
     <h2 id="statement-title">{t(`joiner${stage}Title`)}<br/><em>{t(`joiner${stage}Accent`)}</em></h2>
     <p>{t(`joiner${stage}Body`)}</p>
    </div>
    <div className="joiner-journey" aria-hidden="true">{[0,1,2].map(step=><span key={step} className={step===stage?'is-current':''}>{t(`joinerStep${step}`)}</span>)}</div>
    <a className="line-link joiner-link" href="#atelier">{t('joinerCta')} <ArrowUpRight size={18}/></a>
   </div>
   <div ref={picture} className="joiner-picture" role="img" aria-label={t('joinerImage')}>
    <img className="joiner-source" src={photo} alt="" loading="lazy" decoding="async" onError={()=>setFailed(true)}/>
    <div className="joiner-pieces" aria-hidden="true">{tiles.map((tile,index)=><div key={index} className="joiner-piece" style={{left:`${tile.x*25}%`,top:`${tile.y*100/6}%`,backgroundImage:`url("${photo}")`,backgroundPosition:`${tile.x*100/3}% ${tile.y*20}%`,transform:`translate(${tile.dx}px,${tile.dy}px) rotate(${tile.angle}deg)`}}/>)}</div>
   </div>
  </div>
 </section>;
}
