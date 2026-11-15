import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Plus,X,Menu,Instagram,MessageCircle} from 'lucide-react';
import ScrollFilm from '../sections/ScrollFilm';
import Collection from '../sections/Collection';
import Atelier from '../sections/Atelier';
import InteriorFilm from '../sections/InteriorFilm';
import MotionStory from '../sections/MotionStory';
import {experiments} from '../data/experiments';
import SelectionInquiry from '../sections/SelectionInquiry';
import Contacts from '../sections/Contacts';
import ArtViewer from '../components/gallery/ArtViewer';
import LanguageSwitcher from '../components/navigation/LanguageSwitcher';
import {works,resolveWorkId} from '../data/catalog';
import {useLocale} from '../i18n/LocaleProvider';
import useScrollReveals from '../hooks/useScrollReveals';
import usePageScroll from '../hooks/usePageScroll';
import {INSTAGRAM_URL} from '../data/contact-config';
import {inquiryText,whatsappHref} from '../lib/contact';

const initialSelection=()=>{try{const value=JSON.parse(localStorage.getItem('rasulova-selection')||'[]');return Array.isArray(value)?[...new Set(value.map(resolveWorkId).filter(Boolean))]:[]}catch{return[]}};
const initialWork=()=>works.find(work=>work.id===resolveWorkId(new URLSearchParams(window.location.search).get('work')))||null;
export default function App(){
 const [saved,setSaved]=useState(initialSelection),[active,setActive]=useState(initialWork),[menu,setMenu]=useState(false);
 const root=useRef(null),{t,locale}=useLocale(),picked=works.filter(work=>saved.includes(work.id));
 const showStories=experiments.motionStories&&new URLSearchParams(window.location.search).get('stories')!=='off';
 useScrollReveals(`${locale}:${saved.length}`);
 usePageScroll(root,Boolean(active));
 const toggle=id=>setSaved(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
 useEffect(()=>{try{localStorage.setItem('rasulova-selection',JSON.stringify(saved))}catch{}},[saved]);
 useEffect(()=>{
  if(!window.location.hash)return;
  const frame=requestAnimationFrame(()=>{
   try{document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView({behavior:'instant'})}catch{/* Ignore malformed anchors. */}
  });
  return()=>cancelAnimationFrame(frame);
 },[]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));return()=>cancelAnimationFrame(frame)},[locale,saved.length]);
 function openEntry(entry){if(!entry)return;if(!entry.isPhoto){setActive(entry);return}const owner=works.find(work=>work.id===entry.workId);setActive(owner?{...owner,initialImage:entry.image}:{...entry,name:'В мастерской',selectable:false,images:[entry.image]})}
 return <>
  <a className="skip" href="#collection">{t('skip')}</a>
  <header className="header"><a className="brand" href="#top" aria-label={t('logoHome')}>rasulova<span>ART STUDIO</span></a><nav aria-label={t('navLabel')} className={menu?'navigation open':'navigation'}>{[['collection','navObjects'],['atelier','navAtelier'],['inquiry','navSelection'],['contacts','navContacts']].map(([id,key])=><a key={id} href={'#'+id} onClick={()=>setMenu(false)}>{t(key)}{id==='inquiry'&&<span className="count">{saved.length}</span>}</a>)}</nav><div className="header-right"><LanguageSwitcher/><a className="header-link" href="#contacts">{t('contactAuthor')} <ArrowUpRight size={16}/></a><button className="menu-toggle" aria-label={menu?t('menuClose'):t('menuOpen')} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></header>
  <main ref={root} id="top"><ScrollFilm/>
   <section className="statement" data-sc-act="flow"><span className="small-note" data-aos="fade-right">{t('statementTag')}</span><p data-aos="fade-up">{t('statementTitle1')}<br/><em>{t('statementTitle2')}</em></p><div className="statement-bottom"><p data-aos="fade-left">{t('statementBody')}</p></div></section>
   {showStories&&<MotionStory story="color"/>}
   <Collection saved={saved} active={active} onOpen={openEntry} onToggle={toggle}/>
   {showStories&&<MotionStory story="ritual"/>}
   <Atelier active={active} onOpen={openEntry}/>
   {experiments.interiorScroll&&new URLSearchParams(window.location.search).get('interior')!=='off'&&<InteriorFilm/>}
   <SelectionInquiry picked={picked} onOpen={openEntry} onRemove={toggle}/>
   <Contacts/>
  </main>
  <footer className="footer"><a className="brand" href="#top">rasulova<span>ART STUDIO</span></a><span>{t('signature')}</span><div className="footer-socials"><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18}/></a><a href={whatsappHref(inquiryText([],'',locale))} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle size={18}/></a></div><span>© 2026 RASULOVA ART</span><a href="#top">{t('top')} ↑</a></footer>
  <ArtViewer work={active} selected={active?saved.includes(active.id):false} onToggle={toggle} onClosed={()=>setActive(null)}/>
 </>
}
