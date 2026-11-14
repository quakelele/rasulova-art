// A single handoff after the hero. No snapping is applied to the rest of the page.
export function createHeroExit(host){
 let raf=0,latched=false,intent=0,direction=0,lastTouch=null,dead=false;
 const downKeys=new Set(['ArrowDown','PageDown',' ']),upKeys=new Set(['ArrowUp','PageUp','Home']);
 const editable=target=>target instanceof Element&&Boolean(target.closest('input,textarea,select,[contenteditable],button,dialog[open]'));
 const inside=()=>{const top=host.getBoundingClientRect().top+scrollY,end=top+host.offsetHeight;return scrollY>=top&&scrollY<end-innerHeight*.25};
 function stop(state='cancelled'){cancelAnimationFrame(raf);raf=0;release();host.dataset.exitState=state}
 function guardWheel(e){if(e.deltaY<0||e.ctrlKey){stop();direction=-1}else if(e.cancelable)e.preventDefault()}
 function guardTouch(e){if(lastTouch!==null&&e.touches[0]?.clientY>lastTouch){stop();direction=-1}else if(e.cancelable)e.preventDefault()}
 function guardKey(e){if(upKeys.has(e.key)||['Escape','End','Tab'].includes(e.key)||e.ctrlKey||e.metaKey||e.altKey||(e.key===' '&&e.shiftKey)){stop();direction=-1}else if(downKeys.has(e.key)&&!editable(e.target)&&e.cancelable)e.preventDefault()}
 const pointer=()=>stop();
 function release(){removeEventListener('wheel',guardWheel,true);removeEventListener('touchmove',guardTouch,true);removeEventListener('keydown',guardKey,true);removeEventListener('pointerdown',pointer,true)}
 function complete(){
  if(dead||raf||latched||direction!==1||performance.now()-intent>1800||!inside()||host.dataset.sequenceComplete!=='true')return;
  const next=host.nextElementSibling;if(!next)return;
  const inset=document.querySelector('.header')?.getBoundingClientRect().height||0;
  const from=scrollY,to=next.getBoundingClientRect().top+scrollY-inset;
  if(to<=from+5)return;
  latched=true;host.dataset.exitState='moving';
  addEventListener('wheel',guardWheel,{capture:true,passive:false});addEventListener('touchmove',guardTouch,{capture:true,passive:false});addEventListener('keydown',guardKey,true);
  addEventListener('pointerdown',pointer,true);
  const start=performance.now();
  function step(now){if(dead)return;const p=Math.min(1,(now-start)/640),ease=1-(1-p)**3;scrollTo({top:from+(to-from)*ease,behavior:'instant'});if(p<1)raf=requestAnimationFrame(step);else{raf=0;release();host.dataset.exitState='complete'}}
  raf=requestAnimationFrame(step);
 }
 function remember(delta){if(!delta)return;direction=Math.sign(delta);if(direction>0&&inside()){intent=performance.now();complete()}}
 const wheel=e=>{if(!editable(e.target)&&!e.ctrlKey)remember(e.deltaY)};
 const key=e=>{if(editable(e.target)||e.metaKey||e.ctrlKey||e.altKey)return;if(downKeys.has(e.key))remember(e.shiftKey?-1:1);else if(upKeys.has(e.key))remember(-1)};
 const touchStart=e=>{lastTouch=e.touches[0]?.clientY??null};
 const touchMove=e=>{const y=e.touches[0]?.clientY;if(y!==undefined&&lastTouch!==null){remember(lastTouch-y);lastTouch=y}};
 const reset=()=>{const top=host.getBoundingClientRect().top+scrollY;if(!raf&&scrollY<top+(host.offsetHeight-innerHeight)*.6){latched=false;host.dataset.exitState='ready'}};
 addEventListener('wheel',wheel,{passive:true});addEventListener('keydown',key);addEventListener('touchstart',touchStart,{passive:true});addEventListener('touchmove',touchMove,{passive:true});addEventListener('scroll',reset,{passive:true});
 return{complete,destroy(){dead=true;stop('idle');removeEventListener('wheel',wheel);removeEventListener('keydown',key);removeEventListener('touchstart',touchStart);removeEventListener('touchmove',touchMove);removeEventListener('scroll',reset)}};
}
