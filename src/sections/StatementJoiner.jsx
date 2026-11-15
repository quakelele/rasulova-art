import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';

const photo='/media/images/photo_2026-08-02_11-25-30.webp';
const tiles=Array.from({length:24},(_,index)=>({
 x:index%4,y:Math.floor(index/4),
 dx:Math.sin(index*7.13)*95+(index%4-1.5)*24,dy:Math.cos(index*4.71)*75,
 angle:Math.sin(index*2.37)*17,
 opacity:index%3===0 ? .48+(Math.sin(index*8.31)+1)*.14 : 1
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
  const stageElement=host.querySelector('.joiner-stage');
  const hoverOffsets=pieces.map(()=>({x:0,y:0}));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,visible=false,pointer=null,progress=0,lastTime=0;
  let textStage=0,requestedStage=0,textChangedAt=0,textTimer=0;
  function updateText(){
   textTimer=0;
   if(textStage===requestedStage)return;
   const remaining=1800-(performance.now()-textChangedAt);
   if(!reduced.matches&&remaining>0){textTimer=setTimeout(updateText,remaining);return}
   textStage=reduced.matches?requestedStage:textStage+Math.sign(requestedStage-textStage);
   textChangedAt=performance.now();setStage(textStage);
   if(textStage!==requestedStage)textTimer=setTimeout(updateText,1800);
  }
  function paint(now){
   frame=0;
   if(!visible)return;
   const rect=host.getBoundingClientRect();
   const header=document.querySelector('.header').offsetHeight;
   const target=reduced.matches?1:clamp((header-rect.top)/Math.max(1,host.offsetHeight-innerHeight+header));
   const dt=Math.min(50,lastTime?now-lastTime:16);
   lastTime=now;
   progress=reduced.matches?target:progress+(target-progress)*(1-Math.exp(-dt/35));
   if(Math.abs(target-progress)<.0005)progress=target;
   const amount=clamp(progress/.9);
   requestedStage=progress<.3?0:progress<.68?1:2;
   if(!textChangedAt&&visible)textChangedAt=performance.now();
   if(!textTimer)updateText();
   const loose=1-amount*amount*(3-2*amount);
   const compact=matchMedia('(max-width:700px)').matches ? .55 : 1;
   const bounds=box.getBoundingClientRect();
   const pointerX=pointer?(pointer.x-bounds.left)*box.clientWidth/bounds.width:0;
   const pointerY=pointer?(pointer.y-bounds.top)*box.clientHeight/bounds.height:0;
   const hoverBlend=reduced.matches?1:1-Math.exp(-dt/(pointer?150:220));
   let hoverMoving=false;
   pieces.forEach((piece,index)=>{
    const tile=tiles[index];
    const x=(tile.x+.5)*box.clientWidth/4,y=(tile.y+.5)*box.clientHeight/6;
    const distance=pointer?Math.hypot(x-pointerX,y-pointerY):Infinity;
    const proximity=clamp(1-distance/220);
    const influence=proximity*proximity*(3-2*proximity)*loose;
    const offset=hoverOffsets[index];
    const targetX=pointer&&!reduced.matches?(x-pointerX)*influence*.055:0;
    const targetY=pointer&&!reduced.matches?(y-pointerY)*influence*.055:0;
    offset.x+=(targetX-offset.x)*hoverBlend;
    offset.y+=(targetY-offset.y)*hoverBlend;
    if(Math.abs(targetX-offset.x)<.01)offset.x=targetX;
    if(Math.abs(targetY-offset.y)<.01)offset.y=targetY;
    if(offset.x!==targetX||offset.y!==targetY)hoverMoving=true;
    const localAmount=clamp((amount-index%5*.025)/.9);
    const localLoose=1-localAmount*localAmount*(3-2*localAmount);
    const dx=tile.dx*localLoose*compact+offset.x;
    const dy=tile.dy*localLoose*compact+offset.y;
    piece.style.opacity=String(1-(1-tile.opacity)*localLoose);
    piece.style.transform=`translate(${dx}px,${dy}px) rotate(${tile.angle*localLoose}deg) scale(${1-localLoose*.07})`;
   });
   box.style.setProperty('--joiner-scale',String(.9+amount*.14));
   host.style.setProperty('--joiner-progress',String(amount));
   if(progress!==target||hoverMoving)schedule();
  }
  function schedule(){if(visible&&!frame)frame=requestAnimationFrame(paint)}
  function move(event){
   if(event.pointerType!=='mouse'||reduced.matches)return;
   pointer={x:event.clientX,y:event.clientY};schedule();
  }
  function leave(){pointer=null;schedule()}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastTime=0;schedule()});
  observer.observe(host);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('page-viewport-change',schedule);
  reduced.addEventListener('change',schedule);
  stageElement.addEventListener('pointermove',move);
  stageElement.addEventListener('pointerleave',leave);
  return()=>{
   observer.disconnect();cancelAnimationFrame(frame);clearTimeout(textTimer);
   removeEventListener('scroll',schedule);removeEventListener('resize',schedule);
   removeEventListener('page-viewport-change',schedule);
   reduced.removeEventListener('change',schedule);
   stageElement.removeEventListener('pointermove',move);stageElement.removeEventListener('pointerleave',leave);
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
    <div className="joiner-pieces" aria-hidden="true">{tiles.map((tile,index)=><div key={index} className="joiner-piece" style={{left:`${tile.x*25}%`,top:`${tile.y*100/6}%`,backgroundImage:`url("${photo}")`,backgroundPosition:`${tile.x*100/3}% ${tile.y*20}%`,opacity:tile.opacity,transform:`translate(${tile.dx}px,${tile.dy}px) rotate(${tile.angle}deg)`}}/>)}</div>
   </div>
  </div>
 </section>;
}
