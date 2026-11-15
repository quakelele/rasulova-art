import {useEffect,useRef} from 'react';
import Lenis from 'lenis';

const sectionSelector='.statement,.catalog-category,.collection-archive,.collection-selection,.atelier,.selection-inquiry,.contacts-section';
const ease=t=>1-Math.pow(1-t,4);

// One scroll owner: Lenis drives both the film and the section transitions.
export default function usePageScroll(root,blocked){
 const instance=useRef(null);
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),header=document.querySelector('.header');
  const lenis=new Lenis({autoRaf:true,lerp:.11,smoothWheel:true,syncTouch:false,
   virtualScroll:({event})=>!event.defaultPrevented,
   anchors:{duration:1.05,lerp:0,easing:ease,force:true},
   stopInertiaOnNavigate:true,prevent:node=>node.matches?.('dialog,textarea,[contenteditable=true]')||(node.matches?.('.inquiry-desk')&&node.scrollHeight>node.clientHeight+2)});
  instance.current=lenis;
  let sections=[],points=[],heroEnd=0,measureFrame=0,gestureTimer=0,touchTimer=0,nativeTimer=0,nativeIntent=0;
  let direction=0,gestureTotal=0,consumed=false,moving=false,touchStartY=null,touchStartScroll=0,touchPending=false,touchDirection=0;
  const top=el=>el.getBoundingClientRect().top+window.scrollY;
  function measure(){
   measureFrame=0;lenis.resize();
   const inset=header.offsetHeight,viewport=innerHeight-inset,hero=root.current.querySelector('.hero');
   heroEnd=Math.max(0,top(hero)+hero.offsetHeight-innerHeight);
   sections=[...root.current.querySelectorAll(sectionSelector)].map(el=>{
    const start=top(el)-inset,end=Math.max(start,top(el)+el.offsetHeight-innerHeight);
    return {el,start,end,tall:el.offsetHeight>viewport+3};
   });
   points=[...new Set([heroEnd,...sections.flatMap(s=>s.tall?[s.start,s.end]:[s.start]),lenis.limit].map(y=>Math.round(Math.max(0,Math.min(y,lenis.limit)))))].sort((a,b)=>a-b);
  }
  function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure)}
  function nativeArea(y,dir){
   if(y<heroEnd-3||(dir<0&&y<=heroEnd+3))return true;
   return sections.some(s=>s.tall&&y>=s.start-3&&y<=s.end+3&&((dir>0&&y<s.end-3)||(dir<0&&y>s.start+3)));
  }
  const protectedTarget=target=>{
   if(!(target instanceof Element))return false;
   if(target.closest('dialog,[data-lenis-prevent],textarea,input,select,[contenteditable=true]'))return true;
   const desk=target.closest('.inquiry-desk');return desk&&desk.scrollHeight>desk.clientHeight+2;
  };
  const unavailable=()=>lenis.isStopped||document.querySelector('dialog[open],#startup-loader');
  function go(y){
   if(y===undefined)return;
   moving=true;
   lenis.scrollTo(y,{duration:.92,lerp:0,easing:ease,userData:{initiator:'section'},onComplete:()=>{moving=false}});
  }
  function destination(dir,y=window.scrollY){return dir>0?points.find(p=>p>y+4):points.findLast(p=>p<y-4)}
  function wheel(event){
   if(reduced.matches||unavailable()||event.ctrlKey||event.metaKey||protectedTarget(event.target)||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1),dir=Math.sign(delta);
   if(!dir)return;
   if(nativeArea(scrollY,dir)){nativeIntent=dir>0?performance.now():0;return}
   nativeIntent=0;clearTimeout(nativeTimer);
   event.preventDefault();
   if(moving&&lenis.userData?.initiator!=='section')moving=false;
   clearTimeout(gestureTimer);
   gestureTimer=setTimeout(()=>{consumed=false;gestureTotal=0;direction=0},240);
   if(dir!==direction){direction=dir;gestureTotal=0;consumed=false;if(moving){lenis.scrollTo(scrollY,{immediate:true});moving=false}}
   gestureTotal+=Math.abs(delta);
   if(consumed||moving||gestureTotal<18)return;
   consumed=true;go(destination(dir));
  }
  function key(event){
   if(reduced.matches||unavailable()||protectedTarget(event.target)||event.target.closest?.('button,a,summary')||event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key==='Home'||event.key==='End'){event.preventDefault();nativeIntent=0;go(event.key==='Home'?0:lenis.limit);return}
   const dir=['PageDown','ArrowDown',' '].includes(event.key)?(event.shiftKey?-1:1):['PageUp','ArrowUp'].includes(event.key)?-1:0;
   if(!dir)return;
   if(nativeArea(scrollY,dir)){nativeIntent=dir>0?performance.now():0;return}
   event.preventDefault();if(!event.repeat)go(destination(dir));
  }
  function settleTouch(){
   clearTimeout(touchTimer);
   touchTimer=setTimeout(()=>{
    if(!touchPending)return;touchPending=false;
    if(reduced.matches||unavailable()||nativeArea(scrollY,touchDirection))return;
    const nearest=points.reduce((a,b)=>Math.abs(b-scrollY)<Math.abs(a-scrollY)?b:a,points[0]);
    // Native momentum stays intact; only settle the final composition.
    if(nearest!==undefined&&Math.abs(nearest-scrollY)<innerHeight*.45)go(nearest);
   },180);
  }
  function touchStart(event){
   touchPending=false;clearTimeout(touchTimer);
   touchStartY=protectedTarget(event.target)?null:event.touches[0]?.clientY;
   touchStartScroll=scrollY;
  }
  function touchEnd(event){
   if(touchStartY===null)return;
   const delta=touchStartY-(event.changedTouches[0]?.clientY??touchStartY);
   touchStartY=null;touchDirection=Math.sign(delta);
   if(Math.abs(delta)<24||Math.abs(scrollY-touchStartScroll)<12)return;
   touchPending=true;settleTouch();
  }
  const onScroll=()=>{
   if(touchPending)settleTouch();
   clearTimeout(nativeTimer);
   if(!nativeIntent||moving||reduced.matches||scrollY<=heroEnd+3||nativeArea(scrollY,1))return;
   nativeTimer=setTimeout(()=>{
    if(unavailable()||performance.now()-nativeIntent>3000)return;
    nativeIntent=0;
    const nearest=points.filter(p=>p>heroEnd+3).reduce((a,b)=>a===undefined||Math.abs(b-scrollY)<Math.abs(a-scrollY)?b:a,undefined);
    go(nearest);
   },180);
  };
  const onPointer=()=>{
   touchPending=false;nativeIntent=0;clearTimeout(touchTimer);clearTimeout(nativeTimer);
   if(moving){lenis.scrollTo(scrollY,{immediate:true});moving=false}
  };
  addEventListener('wheel',wheel,{passive:false,capture:true});
  addEventListener('keydown',key);addEventListener('touchstart',touchStart,{passive:true});
  addEventListener('touchend',touchEnd,{passive:true});addEventListener('touchcancel',onPointer,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});addEventListener('pointerdown',onPointer,{passive:true});
  addEventListener('resize',queueMeasure);
  const sizing=new ResizeObserver(queueMeasure);sizing.observe(root.current);sizing.observe(header);
  measure();
  return()=>{
   clearTimeout(gestureTimer);clearTimeout(touchTimer);clearTimeout(nativeTimer);cancelAnimationFrame(measureFrame);sizing.disconnect();
   removeEventListener('wheel',wheel,true);removeEventListener('keydown',key);removeEventListener('touchstart',touchStart);
   removeEventListener('touchend',touchEnd);removeEventListener('touchcancel',onPointer);removeEventListener('scroll',onScroll);
   removeEventListener('pointerdown',onPointer);removeEventListener('resize',queueMeasure);lenis.destroy();instance.current=null;
  };
 },[root]);
 useEffect(()=>{const lenis=instance.current;if(!lenis)return;if(blocked)lenis.stop();else{lenis.start();lenis.resize()}},[blocked]);
}
