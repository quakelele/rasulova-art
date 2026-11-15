import {useEffect} from 'react';
import AOS from 'aos';
let initialized=false;
export default function useScrollReveals(locale){
 useEffect(()=>{
  if(!initialized){AOS.init({duration:750,easing:'ease-out-cubic',offset:60,once:false,mirror:true,anchorPlacement:'top-bottom',disable:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,disableMutationObserver:true});initialized=true}
  let refreshFrame=0,disposed=false;
  const frame=requestAnimationFrame(()=>AOS.refreshHard()),images=[...document.querySelectorAll('img')];
  const refresh=()=>{if(!disposed&&!refreshFrame)refreshFrame=requestAnimationFrame(()=>{refreshFrame=0;AOS.refresh()})};
  images.forEach(image=>image.addEventListener('load',refresh,{once:true}));document.fonts.ready.then(refresh);
  return()=>{disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(refreshFrame);images.forEach(image=>image.removeEventListener('load',refresh))};
 },[locale]);
}
