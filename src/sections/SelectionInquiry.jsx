import {mediaUrl} from '../lib/assets';
import React,{useState} from 'react';
import {X,ArrowUpRight,Copy,Check,MessageCircle,Heart} from 'lucide-react';
import {inquiryText,whatsappHref,copyInquiry} from '../lib/contact';
import {useLocale} from '../i18n/LocaleProvider';
import {AUTHOR_PHONE_DISPLAY} from '../data/contact-config';
export default function SelectionInquiry({picked,onOpen,onRemove}){
 const [note,setNote]=useState(''),[copied,setCopied]=useState(false),[copyError,setCopyError]=useState(false);
 const {t,locale,kind,count}=useLocale(),text=inquiryText(picked,note,locale);
 async function copy(){const ok=await copyInquiry(text);setCopied(ok);setCopyError(!ok);if(ok)setTimeout(()=>setCopied(false),2500)}
 return <section id="inquiry" className="selection-inquiry" data-sc-act="flow">
  <div className="inquiry-heading" data-aos="fade-right"><span className="small-note">{t('selectionTag')}</span><h2>{t('selectionTitle1')}<br/><em>{t('selectionTitle2')}</em></h2><p>{t('selectionBody')}</p><a className="author-contact" href={whatsappHref(inquiryText([],'',locale))} target="_blank" rel="noopener noreferrer"><MessageCircle size={18}/><span>{t('contactAuthor')}<small>{AUTHOR_PHONE_DISPLAY} · WhatsApp</small></span><ArrowUpRight size={18}/></a></div>
  <div className="inquiry-desk" data-aos="fade-left" tabIndex={0}><div className="inquiry-desk-title"><h3>{t('yourSelection')}</h3><span>{picked.length?count(picked.length):t('emptySelected')}</span></div>
   {picked.length?<div className="selection-previews">{picked.map(work=><article className="selection-preview" key={work.id}><button className="selection-preview-image" onClick={()=>onOpen(work)} aria-label={`${t('viewSelected')}: ${work.name}`}><img src={mediaUrl(work.image)} alt={work.name} decoding="async"/><span>{t('view')} <ArrowUpRight size={14}/></span></button><button className="selection-remove" onClick={()=>onRemove(work.id)} aria-label={`${t('remove')}: ${work.name}`}><X size={16}/></button><div className="selection-preview-caption"><span>{kind(work.kind)}</span><h4><button onClick={()=>onOpen(work)}>{work.name}</button></h4></div></article>)}</div>:<div className="selection-empty"><Heart size={24}/><p>{t('emptyMessage')}</p><a href="#collection">{t('returnCollection')} <ArrowUpRight size={16}/></a></div>}
   <label className="inquiry-note" htmlFor="author-note">{t('optionalNote')} <span>{t('optional')}</span></label><textarea id="author-note" value={note} onChange={e=>{setNote(e.target.value);setCopied(false)}} placeholder={t('notePlaceholder')} rows={3} maxLength={1500}/>
   <div className="inquiry-actions"><a className="whatsapp-button" href={whatsappHref(text)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19}/>{t('whatsapp')} <ArrowUpRight size={18}/></a><button className="copy-inquiry" onClick={copy}>{copied?<Check size={17}/>:<Copy size={17}/>} {t(copied?'copied':'copy')}</button></div>
   <p className="inquiry-hint" role="status">{t(copyError?'copyError':'whatsappHint')}</p><details className="message-preview"><summary>{t('previewMessage')}</summary><p>{text}</p></details>
  </div>
 </section>
}

