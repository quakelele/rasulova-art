import {mediaUrl} from '../../lib/assets';
import React from 'react';
import {Eye,Plus,Check,Images} from 'lucide-react';
import {useLocale} from '../../i18n/LocaleProvider';
export default function WorkCard({entry,photoMode,selected,onOpen,onToggle,index}){
 const {t,kind,color}=useLocale(),selectedId=entry.isPhoto?entry.workId:entry.id,name=entry.name==='В мастерской'?t('inStudio'):entry.name;
 return <article className={`work${photoMode?' is-photo':''}`} data-aos="fade-up" data-aos-delay={(index%3)*65}>
  <button className="image-button" onClick={()=>onOpen(entry)} aria-label={`${t('view')}: ${name}`}><div className="work-image"><img src={mediaUrl(entry.image)} alt={`${kind(entry.kind)}, ${name}`} loading="lazy" decoding="async" draggable={false}/><span className="view-icon"><Eye size={19}/></span>{!photoMode&&entry.images.length>1&&<span className="work-view-count"><Images size={13}/>{t('photoCount',{count:entry.images.length})}</span>}</div></button>
  <div className="work-meta"><div><span className="object-kind">{kind(entry.kind)}{entry.color&&<> · {color(entry.color)}</>}</span><h3><button onClick={()=>onOpen(entry)}>{name}</button></h3></div></div>
  <div className="work-actions"><button className="work-details" onClick={()=>onOpen(entry)}><Eye size={15}/>{t('view')}</button>{selectedId&&<button className={`work-add${selected?' selected':''}`} onClick={()=>onToggle(selectedId)} aria-label={`${selected?t('remove'):t('add')}: ${name}`} aria-pressed={selected}>{selected?<Check size={16}/>:<Plus size={16}/>} {selected?t('added'):t('add')}</button>}</div>
 </article>
}

