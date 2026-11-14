import {useEffect} from 'react';
import AOS from 'aos';
let initialized=false;
export default function useScrollReveals(locale){
 useEffect(()=>{if(!initialized){AOS.init({duration:750,easing:'ease-out-cubic',offset:60,once:false,mirror:true,anchorPlacement:'top-bottom',disable:()=>matchMedia('(prefers-reduced-motion: reduce)').matches,disableMutationObserver:true});initialized=true}const frame=requestAnimationFrame(()=>AOS.refreshHard());const images=[...document.querySelectorAll('img')];const refresh=()=>AOS.refresh();images.forEach(image=>image.addEventListener('load',refresh,{once:true}));document.fonts.ready.then(refresh);return()=>{cancelAnimationFrame(frame);images.forEach(image=>image.removeEventListener('load',refresh))}},[locale]);
}
