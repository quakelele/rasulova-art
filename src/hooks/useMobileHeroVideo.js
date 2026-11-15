import {useEffect} from 'react';
import {HERO_LAST_FRAME,HERO_FPS} from '../lib/hero-timeline';

const clamp=n=>Math.max(0,Math.min(1,n));

// A single hardware-decoded video replaces full-HD image decoding on phones.
// Seek requests coalesce to the latest position rather than building a queue.
export default function useMobileHeroVideo(section,windowRef,videoRef,enabled){
 useEffect(()=>{
  if(!enabled)return;
  const host=section.current,windowEl=windowRef.current,video=videoRef.current;
  const copy=host.querySelector('.film-copy'),beats=[...host.querySelectorAll('[data-film-beat]')];
  let raf=0,frameCallback=0,dead=false,top=0,travel=1,p=0,finished=false,visible=true;
  const fps=HERO_FPS,lastFrame=HERO_LAST_FRAME,lastTime=(lastFrame+.5)/fps;
  function ready(){
   if(!host.classList.contains('has-sequence')){host.classList.add('has-sequence');window.dispatchEvent(new Event('hero-ready'))}
  }
  function present(time){
   if(dead)return;ready();
   const frame=Math.min(lastFrame,Math.max(0,Math.round(time*fps)));
   host.dataset.frame=String(frame);host.dataset.targetFrame=String(p*lastFrame);
   host.dataset.decodedFrames='1';host.dataset.renderer='video';
   const complete=frame===lastFrame&&p>.999;
   host.dataset.sequenceComplete=String(complete);
   if(complete&&!finished)window.dispatchEvent(new Event('hero-finished'));
   finished=complete;
  }
  function rendered(_now,metadata){
   present(metadata.mediaTime);
   if(!dead)frameCallback=video.requestVideoFrameCallback(rendered);
  }
  function paint(){
   raf=0;if(dead||!visible)return;
   p=clamp((scrollY-top)/travel);
   const intro=clamp((.18-p)/.07),values=[clamp((p-.20)/.05)*clamp((.40-p)/.04),clamp((p-.42)/.06)*clamp((.65-p)/.04),clamp((p-.67)/.06)];
   copy.style.opacity=intro;copy.style.visibility=intro<.015?'hidden':'visible';
   beats.forEach((node,i)=>{node.style.opacity=values[i];node.style.visibility=values[i]<.015?'hidden':'visible';node.style.transform=`translateY(${(1-values[i])*12}px)`});
   if(video.readyState<2||video.seeking)return;
   const target=(p>.999?1:p<.001?0:p)*lastTime;
   if(Math.abs(video.currentTime-target)>=1/(fps*2))video.currentTime=target;
  }
  function schedule(){if(!dead&&!raf&&visible&&!document.hidden)raf=requestAnimationFrame(paint)}
  function seeked(){requestAnimationFrame(()=>{if(!dead&&!video.seeking)present(video.currentTime)});schedule()}
  function loaded(){ready();present(video.currentTime);schedule()}
  function resize(){
   const viewport=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-height'))||innerHeight;
   top=host.getBoundingClientRect().top+scrollY;travel=Math.max(1,host.offsetHeight-viewport);schedule();
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule()},{rootMargin:`-${document.querySelector('.header').offsetHeight}px 0px 0px`});observer.observe(windowEl);
  video.addEventListener('loadeddata',loaded);video.addEventListener('seeked',seeked);
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',resize);addEventListener('page-viewport-change',resize);
  if(video.requestVideoFrameCallback)frameCallback=video.requestVideoFrameCallback(rendered);
  resize();if(video.readyState>=2)loaded();
  return()=>{dead=true;cancelAnimationFrame(raf);video.cancelVideoFrameCallback?.(frameCallback);observer.disconnect();video.removeEventListener('loadeddata',loaded);video.removeEventListener('seeked',seeked);removeEventListener('scroll',schedule);removeEventListener('resize',resize);removeEventListener('page-viewport-change',resize)};
 },[section,windowRef,videoRef,enabled]);
}
