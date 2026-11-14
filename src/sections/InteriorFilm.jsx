import React,{useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';
import useFrameSequence from '../hooks/useFrameSequence';
const copy={
 ru:{tag:'Искусство в вашем пространстве',title:'Создано руками.',accent:'Выбрано сердцем.',first:'Солнечный свет. Живые цветы. Фактура, к которой хочется прикоснуться.',second:'Особенная вещь становится частью дома. И каждый день немного меняет его настроение.',link:'Собрать свою коллекцию',caption:'Ближе к деталям',hint:'Продолжайте прокрутку'},
 en:{tag:'Art in your space',title:'Made by hand.',accent:'Chosen by heart.',first:'Sunlight. Fresh flowers. A texture that invites your touch.',second:'A special piece becomes part of your home, bringing a little joy to every day.',link:'Build your collection',caption:'A closer look',hint:'Keep scrolling'},
 az:{tag:'Məkanınızda sənət',title:'Əllə yaradılıb.',accent:'Ürəklə seçilib.',first:'Günəş işığı. Təzə çiçəklər. Toxunmaq istədiyiniz bir faktura.',second:'Xüsusi bir əşya evinizin bir hissəsinə çevrilir və hər gün ona yeni əhval qatır.',link:'Kolleksiyanızı yaradın',caption:'Detallara daha yaxın',hint:'Sürüşdürməyə davam edin'}
};
export default function InteriorFilm(){
 const section=useRef(null),canvas=useRef(null),{locale}=useLocale(),text=copy[locale];useFrameSequence(section,canvas);
 return <section id="interior-scene" ref={section} className="interior-film" data-sc-act="pin" data-sc-span="2.25" aria-labelledby="interior-title"><div className="interior-stage" data-sc-stage>
  <div className="interior-editorial"><span className="small-note">{text.tag}</span><h2 id="interior-title">{text.title}<br/><em>{text.accent}</em></h2><div className="interior-thoughts"><p className="interior-first">{text.first}</p><p className="interior-second">{text.second}</p></div><a href="#inquiry" className="line-link">{text.link}<ArrowUpRight size={17}/></a><div className="interior-scroll-hint"><span>{text.hint}</span><div aria-hidden="true"><i/></div></div></div>
  <figure className="interior-art"><div className="interior-image"><img src="/media/interior-sequence/poster.webp" loading="lazy" decoding="async" alt={locale==='ru'?'Фактурная тёмная ваза с белыми цветами в солнечном интерьере':locale==='az'?'Günəşli interyerdə ağ çiçəklərlə tünd fakturalı vaza':'A dark textured vase with white flowers in a sunlit interior'}/><canvas ref={canvas} aria-hidden="true"/></div><figcaption><span>{text.caption}</span><span>RASULOVA ART</span></figcaption></figure>
 </div></section>
}
