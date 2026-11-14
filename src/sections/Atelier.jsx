import {mediaUrl} from '../lib/assets';
import React from 'react';
import {SwiperSlide} from 'swiper/react';
import {Eye,ArrowRight} from 'lucide-react';
import SmoothCarousel from '../components/gallery/SmoothCarousel';
import {allPhotos} from '../data/catalog';
import {useLocale} from '../i18n/LocaleProvider';
const stories=[
 ['images/photo_2026-08-02_11-25-30.webp','caption1'],
 ['images/photo_2026-08-20_14-46-26.webp','caption2'],
 ['images/photo_2026-08-11_01-34-07.webp','caption3'],
 ['images/photo_2026-08-20_14-46-30.webp','caption4'],
 ['images/photo_2026-08-02_11-25-38.webp','caption3']
];
export default function Atelier({active,onOpen}){const{t}=useLocale();return <section id="atelier" className="atelier" data-sc-act="flow"><div className="atelier-intro"><span className="small-note" data-aos="fade-right">{t('atelierTag')}</span><h2 data-aos="fade-right">{t('atelierTitle1')}<br/><em>{t('atelierTitle2')}</em></h2><p data-aos="fade-left">{t('atelierBody')}</p></div><div data-aos="fade-up"><SmoothCarousel className="atelier-slider" navigation pagination={{type:'progressbar'}} keyboard={{enabled:!active,onlyInViewport:true}} a11y={{prevSlideMessage:t('prevFrame'),nextSlideMessage:t('nextFrame')}} spaceBetween={24} slidesPerView={1.12} breakpoints={{650:{slidesPerView:2.2},1000:{slidesPerView:2.75,spaceBetween:30}}}>{stories.map(([image,caption],index)=><SwiperSlide key={image}><figure><button className="atelier-open" onClick={()=>onOpen(allPhotos.find(photo=>photo.image===image||photo.originalImage===image))} aria-label={`${t('workshopView')} ${index+1}`}><img src={mediaUrl(image)} loading="lazy" decoding="async" draggable={false} alt={t(caption)}/><span><Eye size={16}/>{t('view')}</span></button><figcaption>{t(caption)}</figcaption></figure></SwiperSlide>)}</SmoothCarousel></div><p className="atelier-archive-note">{t('curatedViews')} <a href="#collection">{t('allPhotos')} <ArrowRight size={14}/></a></p></section>}

