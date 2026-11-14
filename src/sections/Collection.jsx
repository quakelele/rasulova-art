import React,{useEffect,useRef,useState} from 'react';
import {SwiperSlide} from 'swiper/react';
import {ArrowRight,Heart,Images,Frame,Gift,ArrowUpRight} from 'lucide-react';
import AOS from 'aos';
import {works,allPhotos,categories} from '../data/catalog';
import SmoothCarousel from '../components/gallery/SmoothCarousel';
import WorkCard from '../components/gallery/WorkCard';
import {useLocale} from '../i18n/LocaleProvider';
import {mediaUrl} from '../lib/assets';
function useRefresh(dependency){useEffect(()=>{const frame=requestAnimationFrame(()=>{AOS.refreshHard();window.dispatchEvent(new Event('resize'))});return()=>cancelAnimationFrame(frame)},[dependency])}
function sectionTitle(category,locale,t){return category.title[locale]||({decor:t('categoryDecor'),paintings:t('categoryPaintings'),artbox:t('categoryArtbox')})[category.key]||category.name}
function Category({category,saved,active,onOpen,onToggle}){
 const {t,locale}=useLocale(),[filter,setFilter]=useState('all'),slider=useRef(null),title=sectionTitle(category,locale,t);
 const entries=category.works.filter(work=>filter==='all'||(filter==='vases'?work.kind==='Ваза':work.kind==='Конфетница'));
 useRefresh(`${filter}:${locale}:${entries.length}`);
 const description=category.description[locale]||t(({decor:'decorDescription',paintings:'paintingsDescription',artbox:'artboxDescription'})[category.key]||'customDescription');
 const EmptyIcon=category.key==='artbox'?Gift:Frame;
 return <section id={category.id} className={`collection catalog-category category-${category.key}`} data-sc-act="flow" data-category={category.key}>
  <div className="section-heading"><div data-aos="fade-right"><span className="small-note">{t('collectionTag')}</span><h2>{title}</h2></div><p data-aos="fade-left">{description}</p></div>
  {!category.works.length?<div className="category-empty" data-aos="fade-up"><div className="empty-collection-art"><EmptyIcon size={67} strokeWidth={.7}/></div><div><span className="small-note">{t('comingSoon')}</span><h3>{t('emptyCategory')}</h3><p>{t('emptyCategoryBody')}</p><a className="line-link" href="#contacts">{t('discussIdea')} <ArrowUpRight size={17}/></a></div></div>:<>
   <div className="collection-tools"><div className="filters" role="group" aria-label={t('filterLabel')}>{(category.key==='decor'?[['all','allObjects'],['vases','vases'],['bowls','dishes']]:[['all','allObjects']]).map(([id,key])=><button key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{t(key)}{id==='all'&&<sup>{category.works.length}</sup>}</button>)}</div><span className="tools-note">{t('galleryNote')}</span></div>
   <SmoothCarousel key={`${category.id}:${filter}`} className="works-slider" onSwiper={s=>{slider.current=s}} navigation pagination={{type:'progressbar'}} keyboard={{enabled:!active,onlyInViewport:true}} spaceBetween={22} slidesPerView={1.12} breakpoints={{650:{slidesPerView:1.85,spaceBetween:28},1000:{slidesPerView:2.65,spaceBetween:35}}}>{entries.map((entry,index)=><SwiperSlide key={entry.id}><WorkCard entry={entry} index={index} photoMode={false} selected={saved.includes(entry.id)} onOpen={onOpen} onToggle={onToggle}/></SwiperSlide>)}</SmoothCarousel>
   <div className="collection-index" aria-label={t('allObjects')}>{entries.map((entry,index)=><button key={entry.id} onClick={()=>slider.current?.slideTo(index)} aria-label={entry.name}><img src={mediaUrl(entry.image)} alt="" loading="lazy"/><span>{entry.name}</span></button>)}</div>
  </>}
 </section>
}
export default function Collection({saved,active,onOpen,onToggle}){
 const {t,locale}=useLocale(),[archiveOpen,setArchiveOpen]=useState(false),picked=works.filter(work=>saved.includes(work.id));
 useRefresh(`${archiveOpen}:${locale}:${picked.length}`);
 return <div id="collection" className="catalog-sections">
  <nav className="category-navigation" aria-label={t('collections')}>{categories.map(category=><a key={category.id} href={'#'+category.id}>{sectionTitle(category,locale,t)}<span>{category.works.length||t('comingSoon')}</span></a>)}</nav>
  {categories.map(category=><Category key={category.id} category={category} saved={saved} active={active} onOpen={onOpen} onToggle={onToggle}/>)}
  <section className="collection collection-archive" data-sc-act="flow"><div className="archive-discovery"><span>{t('archiveHeading')}</span><button aria-expanded={archiveOpen} onClick={()=>setArchiveOpen(!archiveOpen)}><Images size={17}/>{archiveOpen?t('hideArchive'):t('viewPhotos',{count:allPhotos.length})}<ArrowRight size={17}/></button></div>
   {archiveOpen&&<SmoothCarousel className="works-slider archive-slider" navigation pagination={{type:'progressbar'}} keyboard={{enabled:!active,onlyInViewport:true}} spaceBetween={22} slidesPerView={1.12} breakpoints={{650:{slidesPerView:1.85,spaceBetween:28},1000:{slidesPerView:2.65,spaceBetween:35}}}>{allPhotos.map((entry,index)=><SwiperSlide key={entry.id}><WorkCard entry={entry} index={index} photoMode selected={saved.includes(entry.workId)} onOpen={onOpen} onToggle={onToggle}/></SwiperSlide>)}</SmoothCarousel>}
   <div className="exhibition" data-aos="fade-up"><div className="exhibition-title"><Heart size={20}/><h3>{t('shelfTitle')}</h3><span>{picked.length?`${picked.length} ${t('of')} ${works.length}`:t('startWithOne')}</span></div><div className={'shelf '+(!picked.length?'empty':'')}>{picked.length?picked.map(work=><button key={work.id} onClick={()=>onOpen(work)} aria-label={`${t('viewSelected')}: ${work.name}`}><img src={mediaUrl(work.image)} alt={work.name} decoding="async"/><span>{work.name}</span></button>):<p>{t('shelfEmpty')}</p>}</div><a className="line-link" href="#inquiry">{t('discussSelection')} <ArrowRight size={18}/></a></div>
  </section>
 </div>
}
