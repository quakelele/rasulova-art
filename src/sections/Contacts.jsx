import React from 'react';
import {Instagram,MessageCircle,Phone,ArrowUpRight} from 'lucide-react';
import {AUTHOR_PHONE,AUTHOR_PHONE_DISPLAY,INSTAGRAM_URL,INSTAGRAM_HANDLE} from '../data/contact-config';
import {inquiryText,whatsappHref} from '../lib/contact';
import {useLocale} from '../i18n/LocaleProvider';
export default function Contacts(){const{t,locale}=useLocale();return <section id="contacts" className="contacts-section" data-sc-act="flow"><div data-aos="fade-right"><span className="small-note">{t('contactsTag')}</span><h2>{t('contactsTitle1')}<br/><em>{t('contactsTitle2')}</em></h2><p>{t('contactsBody')}</p></div><div className="contact-channels" data-aos="fade-left">{[
 {label:'WhatsApp',value:AUTHOR_PHONE_DISPLAY,description:t('whatsappDesc'),href:whatsappHref(inquiryText([],'',locale)),Icon:MessageCircle,external:true},
 {label:'Instagram',value:INSTAGRAM_HANDLE,description:t('instagramDesc'),href:INSTAGRAM_URL,Icon:Instagram,external:true},
 {label:t('phone'),value:AUTHOR_PHONE_DISPLAY,description:t('phoneDesc'),href:`tel:+${AUTHOR_PHONE}`,Icon:Phone}
].map(({label,value,description,href,Icon,external})=><a className="contact-channel" key={label} href={href} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined}><Icon size={22}/><div><span>{label}</span><strong>{value}</strong><p>{description}</p></div><ArrowUpRight size={19}/></a>)}</div></section>}
