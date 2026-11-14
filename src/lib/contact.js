import {messages,kindKeys,colorKeys} from '../i18n/messages.js';
import {AUTHOR_PHONE} from '../data/contact-config.js';
export {AUTHOR_PHONE};
export function inquiryText(works,note='',locale='ru',origin=window.location.origin){
 const url=new URL(origin),publicHost=!/^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
 const m=messages[locale]||messages.ru,lines=[m.messageHello];
 if(works.length){lines.push(m.messageLikes,'');works.forEach((w,i)=>{const details=[m[kindKeys[w.kind]]||w.kind,w.color?(m[colorKeys[w.color]]||w.color).toLocaleLowerCase(locale):''].filter(Boolean).join(', ');lines.push(`${i+1}. ${w.name}. ${details}.`);if(publicHost)lines.push(`${url.origin}${window.location.pathname}?work=${encodeURIComponent(w.id)}&lang=${locale}#collection`)});lines.push('',m.messageAsk)}else lines.push(m.messageCustom);
 if(note.trim())lines.push('',note.trim());
 return lines.join('\n');
}
export const whatsappHref=text=>`https://wa.me/${AUTHOR_PHONE}?text=${encodeURIComponent(text)}`;
export async function copyInquiry(text){
 try{await navigator.clipboard.writeText(text);return true}catch{
  const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();return copied;
 }
}
