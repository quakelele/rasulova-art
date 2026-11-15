import {mediaUrl} from '../../lib/assets';
import React,{useEffect,useRef,useState} from 'react';
import {motion,useAnimationControls,useReducedMotion} from 'framer-motion';
import {X,Plus,Check,ArrowUpRight} from 'lucide-react';
import {SwiperSlide} from 'swiper/react';
import SmoothCarousel from './SmoothCarousel';
import {inquiryText,whatsappHref} from '../../lib/contact';
import {useLocale} from '../../i18n/LocaleProvider';

export default function ArtViewer({work,selected,onToggle,onClosed}){
 const dialog=useRef(null),slider=useRef(null),lastFocus=useRef(null),closing=useRef(false);
 const controls=useAnimationControls(),reduced=useReducedMotion();
 const {t,kind,color,locale}=useLocale(),name=work?.name==='В мастерской'?t('inStudio'):work?.name;
 const [index,setIndex]=useState(0),[isClosing,setIsClosing]=useState(false);
 const images=work?.images||[];
 useEffect(()=>{
  if(!work)return;
  closing.current=false;setIsClosing(false);lastFocus.current=document.activeElement;
  const initial=Math.max(0,images.indexOf(work.initialImage));setIndex(initial);
  controls.set({opacity:0,y:reduced?0:22,scale:reduced?1:.975});
  if(!dialog.current.open)dialog.current.showModal();
  const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const raf=requestAnimationFrame(()=>{slider.current?.update();slider.current?.slideTo(initial,0);controls.start({opacity:1,y:0,scale:1,transition:{duration:reduced?0:.42,ease:[.22,1,.36,1]}})});
  return()=>{cancelAnimationFrame(raf);document.body.style.overflow=oldOverflow};
 },[work?.id,work?.initialImage,controls,reduced]);
 async function close(){
  if(closing.current)return;closing.current=true;setIsClosing(true);
  await controls.start({opacity:0,y:reduced?0:12,scale:reduced?1:.985,transition:{duration:reduced?0:.24,ease:[.4,0,.6,1]}});
  dialog.current?.close();onClosed();if(lastFocus.current?.isConnected)lastFocus.current.focus({preventScroll:true});
 }
 return <dialog ref={dialog} className={`premium-viewer${isClosing?' is-closing':''}`} aria-label={work?`${t('view')}: ${name}`:t('view')} onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===dialog.current)close()}}>
  {work&&<motion.div className="viewer-shell" animate={controls} initial={{opacity:0}}>
   <header className="viewer-header"><span>RASULOVA ART</span><span>{t('viewerPrivate')}</span><button className="viewer-close" onClick={close} aria-label={t('closeViewer')}><X size={20}/></button></header>
   <div className="viewer-body"><div className="viewer-art">
    <SmoothCarousel key={`${work.id}:${work.initialImage||''}`} className="viewer-carousel" navigation={images.length>1} keyboard={{enabled:true,onlyInViewport:true}} initialSlide={Math.max(0,images.indexOf(work.initialImage))} a11y={{prevSlideMessage:t('prevFrame'),nextSlideMessage:t('nextFrame')}} onSwiper={s=>{slider.current=s}} onSlideChange={s=>setIndex(s.activeIndex)}>
     {images.map((image,i)=><SwiperSlide key={image}><img className="viewer-photo" ref={node=>{if(node?.complete&&node.naturalWidth)node.classList.add('is-loaded')}} onLoad={e=>e.currentTarget.classList.add('is-loaded')} src={mediaUrl(image)} alt={`${name}, ${t('photograph')} ${i+1}`} decoding="async" loading={i<2?'eager':'lazy'} draggable={false}/></SwiperSlide>)}
    </SmoothCarousel>
    <div className="viewer-image-caption"><span>{kind(work.kind)}</span><span>{index+1} / {images.length}</span></div>
    {images.length>1&&<div className="viewer-thumbnails" aria-label={t('thumbnails')}>{images.map((image,i)=><button key={image} aria-label={t('showPhoto',{count:i+1})} aria-pressed={index===i} onClick={()=>slider.current?.slideTo(i)}><img src={mediaUrl(image)} alt="" loading="lazy" decoding="async"/></button>)}</div>}
   </div><div className="viewer-info"><span className="small-note">{t('viewerTag')}</span><h2>{name}</h2><dl><div><dt>{t('object')}</dt><dd>{kind(work.kind)}</dd></div>{work.color&&<div><dt>{t('palette')}</dt><dd>{color(work.color)}</dd></div>}</dl><p>{t(work.selectable===false?'studioBody':'objectBody')}</p>
    {work.selectable!==false&&<div className="viewer-actions"><button className={'primary-button '+(selected?'is-saved':'')} onClick={()=>onToggle(work.id)}>{selected?t('added'):t('add')}{selected?<Check size={18}/>:<Plus size={18}/>}</button><a className="viewer-contact" href={whatsappHref(inquiryText([work],'',locale))} target="_blank" rel="noopener noreferrer">{t('discussWork')} <ArrowUpRight size={17}/></a></div>}
    <span className="viewer-signature">{t('signature')}</span>
   </div></div>
  </motion.div>}
 </dialog>
}

