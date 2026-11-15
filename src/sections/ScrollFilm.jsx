import React,{useEffect,useRef} from 'react';
import {useReducedMotion} from 'framer-motion';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';
import useHeroFrames from '../hooks/useHeroFrames';

const sequenceBase='/media/hero-last';

export default function ScrollFilm(){
 const section=useRef(null),canvas=useRef(null),windowRef=useRef(null);
 const mobile=useRef(matchMedia('(pointer:coarse), (max-width:700px)').matches).current;
 const reduced=useReducedMotion(); const {t}=useLocale();
 useHeroFrames(section,canvas,windowRef,reduced===false);
 useEffect(()=>{
  const host=section.current;
  const introduce=()=>host.classList.add('is-introduced');
  if(document.documentElement.dataset.siteReady==='true'||!document.getElementById('startup-loader'))introduce();
  else addEventListener('site-ready',introduce,{once:true});
  return()=>removeEventListener('site-ready',introduce);
 },[]);
 return <section ref={section} className="hero film sequence-film" data-sc-act="pin" data-sc-span={mobile?"1.3":"1.32"} data-sc-verify-state="poster" aria-labelledby="hero-title"><div className="film-stage" data-sc-stage><div className="film-window" ref={windowRef}><picture><source media="(prefers-reduced-motion: reduce)" srcSet={`${sequenceBase}/frames/frame-122.webp`}/><img className="film-poster" src={`${sequenceBase}/frames/frame-000.webp`} alt={t('heroCaption')} fetchpriority="high"/></picture><canvas ref={canvas} className="film-canvas" aria-hidden="true"/><div className="film-copy"><span className="film-eyebrow">{t('heroEyebrow')}</span><h1 id="hero-title"><span className="film-title-line">{t('heroTitle1')}</span><em className="film-title-line">{t('heroTitle2')}</em></h1><p>{t('heroIntro')}</p><a className="line-link" href="#collection">{t('heroCta')} <ArrowUpRight size={20}/></a></div><div className="film-text-beat" data-film-beat="3"><span>{t('heroEyebrow')}</span><h2>{t('heroBeat3Title')}</h2><p>{t('heroBeat3Body')}</p><a className="line-link" href="#collection">{t('heroCta')} <ArrowUpRight size={18}/></a></div><div className="film-caption"><span>{t('heroCaption')}</span><span>RASULOVA ART</span></div></div><div className="film-mat"><span>RASULOVA ART</span><span>{t('heroMat')}</span></div></div></section>
}
