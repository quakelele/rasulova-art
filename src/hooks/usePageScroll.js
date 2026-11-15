import {useEffect,useRef} from 'react';
import Lenis from 'lenis';

const sectionSelector='.statement,.catalog-category,.collection-archive,.collection-selection,.atelier,.selection-inquiry,.contacts-section';
const ease=t=>1-Math.pow(1-t,4);

// Desktop chapters use Lenis. Mobile content stays native outside the hero.
export default function usePageScroll(root,blocked){
 const instance=useRef(null),refreshViewport=useRef(null);
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),touchDevice=matchMedia('(pointer:coarse), (max-width:700px)'),header=document.querySelector('.header');
  const directionalPan=CSS.supports('touch-action','pan-x pan-up pinch-zoom');
  const lenis=new Lenis({autoRaf:true,lerp:.11,smoothWheel:true,syncTouch:false,
   virtualScroll:({event})=>!touchDevice.matches&&!event.defaultPrevented,
   anchors:false,
   stopInertiaOnNavigate:true,prevent:node=>node.matches?.('dialog,textarea,[contenteditable=true]')||(touchDevice.matches&&node.matches?.('.selection-inquiry'))||(node.matches?.('.inquiry-desk')&&node.scrollHeight>node.clientHeight+2)});
  instance.current=lenis;
  const page=document.documentElement;
  const heroVisual=root.current.querySelector('.hero');
  let lastHeroExit='';
  let viewportHeight=innerHeight,viewportWidth=innerWidth,viewportPending=false,viewportTimer=0,landing=null,nativeTransition=null,nativeFinishTimer=0,transitionWatchdog=0;
  page.style.setProperty('--page-height',`${viewportHeight}px`);
  page.classList.toggle('is-short-viewport',viewportHeight<=740);
  let sections=[],points=[],heroEnd=0,measureFrame=0,gestureTimer=0,touchFrame=0,heroHandoffFrame=0;
  let direction=0,gestureTotal=0,consumed=false,moving=false,touchGesture=null,heroHandoff=false,heroArmed=true,touchDown=false,handoffPending=false,heroWheelQuietUntil=0,lastScrollY=scrollY;
  // Layout coordinates remain stable while the two chapter cards scale.
  const top=el=>{let y=0;for(let node=el;node;node=node.offsetParent)y+=node.offsetTop;return y};
  function measure(){
   measureFrame=0;lenis.resize();
   const inset=header.offsetHeight,viewport=viewportHeight-inset,hero=root.current.querySelector('.hero');
   heroEnd=Math.max(0,top(hero)+hero.offsetHeight-viewportHeight);
   sections=[...root.current.querySelectorAll(sectionSelector)].map(el=>{
    const start=top(el)-inset,end=Math.max(start,top(el)+el.offsetHeight-viewportHeight);
    const tall=el.offsetHeight>viewport+3;
    el.toggleAttribute('data-page-snap',!touchDevice.matches&&!reduced.matches&&(!tall||directionalPan)&&!el.matches('.selection-inquiry'));
    el.toggleAttribute('data-page-tall',tall);
    const card=el.matches('.statement')||el===root.current.querySelector('.catalog-category');
    el.toggleAttribute('data-card-exit',card);
    return {el,start,end,tall,card};
   });
   points=[...new Set([heroEnd,...sections.flatMap(s=>s.tall?[s.start,s.end]:[s.start]),lenis.limit].map(y=>Math.round(Math.max(0,Math.min(y,lenis.limit)))))].sort((a,b)=>a-b);
   syncGestureMode();
  }
  function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure)}
  function updateViewport(){
   clearTimeout(viewportTimer);
   if(viewportHeight===innerHeight&&viewportWidth===innerWidth){viewportPending=false;return}
   viewportPending=true;
   if(moving||touchGesture||lenis.isStopped)return;
   if(lenis.isScrolling==='smooth'||(lenis.isScrolling==='native'&&Math.abs(lenis.velocity)>.5)){viewportTimer=setTimeout(updateViewport,120);return}
   const anchor=landing||sections.flatMap(s=>[{el:s.el,edge:'start',value:s.start},{el:s.el,edge:'end',value:s.end}]).find(p=>Math.abs(scrollY-p.value)<3);
   const reading=sections.find(s=>scrollY>=s.start&&scrollY<s.start+s.el.offsetHeight);
   const offset=reading?scrollY-reading.start:0;
   const filmProgress=heroEnd>0&&scrollY<=heroEnd?scrollY/heroEnd:null;
   viewportHeight=innerHeight;viewportWidth=innerWidth;viewportPending=false;
   page.style.setProperty('--page-height',`${viewportHeight}px`);
   page.classList.toggle('is-short-viewport',viewportHeight<=740);
   measure();
   if(anchor?.el.isConnected)lenis.scrollTo(anchor.edge==='end'?top(anchor.el)+anchor.el.offsetHeight-viewportHeight:top(anchor.el)-header.offsetHeight,{immediate:true});
   else if(filmProgress!==null)lenis.scrollTo(filmProgress*heroEnd,{immediate:true});
   else if(reading)lenis.scrollTo(top(reading.el)-header.offsetHeight+offset,{immediate:true});
   landing=null;
   window.dispatchEvent(new Event('page-viewport-change'));
  }
  function resizeViewport(){
   viewportPending=viewportHeight!==innerHeight||viewportWidth!==innerWidth;
   clearTimeout(viewportTimer);viewportTimer=setTimeout(updateViewport,180);
   queueMeasure();
  }
  refreshViewport.current=updateViewport;
  function nativeArea(y,dir){
   if(y<heroEnd-3||(dir<0&&y<=heroEnd+3))return true;
   return sections.some(s=>s.tall&&y>=s.start-3&&y<=s.end+3&&((dir>0&&y<s.end-3)||(dir<0&&y>s.start+3)));
  }
  const mobileFormTarget=target=>touchDevice.matches&&target instanceof Element&&Boolean(target.closest('.selection-inquiry'));
  const mobileFormPosition=()=>touchDevice.matches&&sections.some(s=>s.el.matches('.selection-inquiry')&&scrollY>=s.start-3&&scrollY<s.start+s.el.offsetHeight);
  function syncGestureMode(){
   page.classList.toggle('is-reading-inquiry',mobileFormPosition());
   page.classList.toggle('is-scrubbing-hero',!reduced.matches&&heroEnd>0&&scrollY<=heroEnd+3);
   for(const s of sections){if(!s.tall)continue;const edge=scrollY<=s.start+3?'start':scrollY>=s.end-3?'end':'middle';if(s.el.dataset.tallEdge!==edge)s.el.dataset.tallEdge=edge}
   const distance=Math.max(1,(sections[0]?.start??heroEnd+viewportHeight)-heroEnd);
   const exit=reduced.matches?0:Math.max(0,Math.min(1,(scrollY-heroEnd)/distance));
   const value=(exit*exit*(3-2*exit)).toFixed(4);
   if(value!==lastHeroExit){
    lastHeroExit=value;heroVisual.style.setProperty('--hero-exit',value);
   }
   heroVisual.classList.toggle('has-exit-motion',exit>0&&exit<1);
   for(let i=0;i<sections.length;i++){
    const s=sections[i];if(!s.card)continue;
    const span=Math.max(1,(sections[i+1]?.start??s.end+viewportHeight)-s.end);
    const p=reduced.matches?0:Math.max(0,Math.min(1,(scrollY-s.end)/span));
    const value=(p*p*(3-2*p)).toFixed(4);
    if(s.el.style.getPropertyValue('--chapter-exit')!==value)s.el.style.setProperty('--chapter-exit',value);
    s.el.classList.toggle('has-card-exit',p>0&&p<1);
   }
  }
  function releaseNativeScroll(){
   cancelAnimationFrame(touchFrame);
   if(moving||nativeTransition||lenis.isScrolling==='smooth'){
    window.scrollTo({top:scrollY,behavior:'instant'});
    lenis.reset();moving=false;nativeTransition=null;landing=null;clearTimeout(nativeFinishTimer);
   }
  }
  const protectedTarget=target=>{
   if(!(target instanceof Element))return false;
   if(mobileFormTarget(target))return true;
   if(target.closest('dialog,[data-lenis-prevent],textarea,input,select,[contenteditable=true]'))return true;
   const desk=target.closest('.inquiry-desk');return desk&&desk.scrollHeight>desk.clientHeight+2;
  };
  const unavailable=()=>lenis.isStopped||document.querySelector('dialog[open],#startup-loader');
  function completeTransition(){
   moving=false;nativeTransition=null;clearTimeout(nativeFinishTimer);clearTimeout(transitionWatchdog);
   if(heroHandoff){heroHandoff=false;heroWheelQuietUntil=performance.now()+240;page.classList.remove('is-hero-handoff');root.current.querySelector('.hero').dataset.exitState='complete'}
   if(viewportPending){clearTimeout(viewportTimer);viewportTimer=setTimeout(updateViewport,0)}else landing=null;
  }
  function finishNative(){if(nativeTransition&&Math.abs(scrollY-nativeTransition.target)<2)completeTransition()}
  function go(y){
   if(y===undefined)return;
   y=Math.max(0,Math.min(y,lenis.limit));
   landing=sections.flatMap(s=>[{el:s.el,edge:'start',value:s.start},{el:s.el,edge:'end',value:s.end}]).find(p=>Math.abs(p.value-y)<2)||null;
   moving=true;
   clearTimeout(transitionWatchdog);
   // A touch can cancel browser smooth scrolling without reaching its target.
   // Always release gesture ownership, even when scrollend never reaches it.
   transitionWatchdog=setTimeout(completeTransition,1600);
   if(touchDevice.matches&&!reduced.matches){
    // Browser smooth scroll can run on the compositor instead of a JS rAF per
    // pixel. Lenis still tracks native position, dimensions, and dialog locking.
    clearTimeout(nativeFinishTimer);nativeTransition={target:y};
    window.scrollTo({top:y,behavior:'smooth'});
    nativeFinishTimer=setTimeout(finishNative,180);
   }else lenis.scrollTo(y,{duration:.92,lerp:0,easing:ease,userData:{initiator:'section'},onComplete:completeTransition});
  }
  function scrubHero(y,immediate){
   const target=Math.max(0,Math.min(heroEnd,y));
   // A fresh downward gesture at a previously visited final frame must exit,
   // even though the renderer has no new frame to announce.
   if(y>heroEnd+3&&scrollY>=heroEnd-3&&heroVisual.dataset.sequenceComplete==='true'){
    heroArmed=true;finishHero();return;
   }
   if(immediate){window.scrollTo({top:target,behavior:'instant'});lenis.reset()}
   else lenis.scrollTo(target,{programmatic:false,lerp:.14});
  }
  function finishHero(){
   if(reduced.matches||unavailable()||moving||heroHandoff||!heroArmed||scrollY<heroEnd-4||scrollY>heroEnd+8)return;
   heroArmed=false;heroHandoff=true;touchGesture=null;
   page.classList.add('is-hero-handoff');
   window.scrollTo({top:heroEnd,behavior:'instant'});lenis.reset();
   const hero=root.current.querySelector('.hero');hero.dataset.exitState='holding';
   // Wait for finger release: starting native smooth scroll during a touch
   // lets the browser cancel it before reaching the next section.
   handoffPending=true;if(!touchDown)startHandoff();
  }
  function startHandoff(){
   if(!handoffPending)return;handoffPending=false;
   const hero=heroVisual;
   heroHandoffFrame=requestAnimationFrame(()=>{heroHandoffFrame=requestAnimationFrame(()=>{
    hero.dataset.exitState='moving';go(sections[0]?.start);
   })});
  }
  function anchorClick(event){
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
   const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
   const url=new URL(link.href,location.href);
   if(url.origin!==location.origin||url.pathname!==location.pathname||url.search!==location.search||!url.hash)return;
   let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)))}catch{return}
   if(!target)return;
   event.preventDefault();measure();history.pushState(null,'',url.hash);go(top(target)-header.offsetHeight);
  }
  function destination(dir,y=window.scrollY){return dir>0?points.find(p=>p>y+4):points.findLast(p=>p<y-4)}
  function wheel(event){
   if(!reduced.matches&&(heroHandoff||performance.now()<heroWheelQuietUntil)){
    event.preventDefault();heroWheelQuietUntil=performance.now()+240;return;
   }
   if(touchDevice.matches&&scrollY>heroEnd+3){releaseNativeScroll();return}
   if(reduced.matches||unavailable()||event.ctrlKey||event.metaKey||protectedTarget(event.target)||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1),dir=Math.sign(delta);
   if(!dir)return;
   if(scrollY<=heroEnd+3&&heroEnd>0){event.preventDefault();scrubHero(lenis.targetScroll+delta,false);return}
   if(nativeArea(scrollY,dir))return;
   event.preventDefault();
   if(moving&&!nativeTransition&&lenis.userData?.initiator!=='section')moving=false;
   clearTimeout(gestureTimer);
   gestureTimer=setTimeout(()=>{consumed=false;gestureTotal=0;direction=0},240);
   if(dir!==direction){direction=dir;gestureTotal=0;consumed=false;if(moving){window.scrollTo({top:scrollY,behavior:'instant'});lenis.scrollTo(scrollY,{immediate:true});moving=false;nativeTransition=null;clearTimeout(nativeFinishTimer)}}
   gestureTotal+=Math.abs(delta);
   if(consumed||moving||gestureTotal<18)return;
   consumed=true;go(destination(dir));
  }
  function key(event){
   if(heroHandoff&&['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key)){event.preventDefault();return}
   if(touchDevice.matches&&scrollY>heroEnd+3)return;
   if(reduced.matches||unavailable()||protectedTarget(event.target)||event.target.closest?.('button,a,summary')||event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:lenis.limit);return}
   const dir=['PageDown','ArrowDown',' '].includes(event.key)?(event.shiftKey?-1:1):['PageUp','ArrowUp'].includes(event.key)?-1:0;
   if(!dir)return;
   if(scrollY<=heroEnd+3&&heroEnd>0){event.preventDefault();scrubHero(scrollY+dir*(event.key.startsWith('Page')||event.key===' '?viewportHeight*.8:80),false);return}
   if(nativeArea(scrollY,dir))return;
   event.preventDefault();if(!event.repeat)go(destination(dir));
  }
  function touchStart(event){
   touchDown=true;
   if(touchDevice.matches&&scrollY>heroEnd+3&&!heroHandoff){releaseNativeScroll();touchGesture=null;return}
   const freeForm=mobileFormTarget(event.target)||mobileFormPosition();
   if(freeForm)releaseNativeScroll();
   cancelAnimationFrame(touchFrame);
   if(heroHandoff){touchGesture=null;return}
   const finger=event.touches[0];
   touchGesture=event.touches.length!==1||!finger||reduced.matches||unavailable()||freeForm||protectedTarget(event.target)?null:
    {x:finger.clientX,y:finger.clientY,scroll:scrollY,axis:null,kind:null,snap:Boolean(event.target.closest?.('[data-page-snap]')),free:Boolean(event.target.closest?.('.selection-inquiry')),hero:scrollY<=heroEnd+3&&heroEnd>0};
  }
  function touchMove(event){
   const gesture=touchGesture,finger=event.touches[0];
   if(!gesture||!finger)return;
   if(event.touches.length!==1){touchGesture=null;return}
   const dx=gesture.x-finger.clientX,dy=gesture.y-finger.clientY;
   if(!gesture.axis){
    if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
    gesture.axis=Math.abs(dx)>Math.abs(dy)?'horizontal':'vertical';
    gesture.kind=gesture.axis==='vertical'?(gesture.hero?'hero':gesture.snap&&!nativeArea(gesture.scroll,Math.sign(dy))?'section':'native'):'native';
   }
   if(gesture.kind==='hero'&&!heroHandoff)scrubHero(gesture.scroll+dy,true);
   // CSS touch-action owns section gestures; this listener never blocks native
   // scrolling. The film, tall content, form, and zoom remain browser controlled.
  }
  function touchEnd(event){
   touchDown=false;if(handoffPending)startHandoff();
   const gesture=touchGesture;touchGesture=null;
   if(viewportPending){clearTimeout(viewportTimer);viewportTimer=setTimeout(updateViewport,180)}
   if(!gesture||heroHandoff||gesture.axis==='horizontal'||gesture.free||gesture.kind==='hero')return;
   const delta=gesture.y-(event.changedTouches[0]?.clientY??gesture.y);
   const touchDirection=Math.sign(delta);
   if(gesture.kind==='section'){
    if(Math.abs(delta)<32||unavailable()||reduced.matches)return;
    // Run after Lenis's native touchend handler, which cancels touch inertia.
    touchFrame=requestAnimationFrame(()=>{if(!unavailable()&&!reduced.matches){measure();go(destination(touchDirection,gesture.scroll))}});
    return;
   }

  }
  const onScroll=()=>{
   syncGestureMode();
   if(scrollY<lastScrollY-1&&scrollY>=heroEnd-4)heroArmed=false;
   if(scrollY<heroEnd-viewportHeight*.08)heroArmed=true;
   lastScrollY=scrollY;
   if(nativeTransition){clearTimeout(nativeFinishTimer);nativeFinishTimer=setTimeout(finishNative,160)}
  };
  const onPointer=()=>{
   if(heroHandoff)return;
   if(moving||lenis.isScrolling==='smooth'){window.scrollTo({top:scrollY,behavior:'instant'});lenis.reset();moving=false;landing=null;nativeTransition=null;clearTimeout(nativeFinishTimer)}
   if(viewportPending){clearTimeout(viewportTimer);viewportTimer=setTimeout(updateViewport,180)}
  };
  const touchCancel=()=>{touchDown=false;if(handoffPending)startHandoff();touchGesture=null;cancelAnimationFrame(touchFrame);if(viewportPending)resizeViewport()};
  addEventListener('wheel',wheel,{passive:false,capture:true});
  addEventListener('keydown',key);addEventListener('touchstart',touchStart,{passive:true});
  addEventListener('touchmove',touchMove,{passive:true});
  addEventListener('touchend',touchEnd,{passive:true});addEventListener('touchcancel',touchCancel,{passive:true});
  addEventListener('scroll',onScroll,{passive:true});addEventListener('pointerdown',onPointer,{passive:true});
  addEventListener('scrollend',finishNative);addEventListener('click',anchorClick);
  addEventListener('hero-finished',finishHero);
  addEventListener('resize',resizeViewport);
  reduced.addEventListener('change',queueMeasure);
  const sizing=new ResizeObserver(queueMeasure);sizing.observe(root.current);sizing.observe(header);
  measure();
  return()=>{
   clearTimeout(transitionWatchdog);clearTimeout(gestureTimer);cancelAnimationFrame(heroHandoffFrame);clearTimeout(nativeFinishTimer);clearTimeout(viewportTimer);cancelAnimationFrame(touchFrame);cancelAnimationFrame(measureFrame);sizing.disconnect();
   removeEventListener('wheel',wheel,true);removeEventListener('keydown',key);removeEventListener('touchstart',touchStart);
   removeEventListener('touchmove',touchMove);removeEventListener('touchend',touchEnd);removeEventListener('touchcancel',touchCancel);removeEventListener('scroll',onScroll);
   removeEventListener('pointerdown',onPointer);removeEventListener('resize',resizeViewport);lenis.destroy();instance.current=null;refreshViewport.current=null;
   removeEventListener('scrollend',finishNative);removeEventListener('click',anchorClick);
   removeEventListener('hero-finished',finishHero);
   page.style.removeProperty('--page-height');page.classList.remove('is-short-viewport','is-reading-inquiry','is-scrubbing-hero','is-hero-handoff');
   reduced.removeEventListener('change',queueMeasure);sections.forEach(s=>{s.el.removeAttribute('data-card-exit');s.el.style.removeProperty('--chapter-exit');s.el.classList.remove('has-card-exit');s.el.removeAttribute('data-page-snap');s.el.removeAttribute('data-page-tall');s.el.removeAttribute('data-tall-edge')});
   heroVisual.style.removeProperty('--hero-exit');heroVisual.classList.remove('has-exit-motion');
  };
 },[root]);
 useEffect(()=>{const lenis=instance.current;if(!lenis)return;if(blocked)lenis.stop();else{lenis.start();refreshViewport.current?.();lenis.resize()}},[blocked]);
}
