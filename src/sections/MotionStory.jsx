import React,{useRef} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {useLocale} from '../i18n/LocaleProvider';
import {motionStories} from '../data/motion-stories';
import useFrameSequence from '../hooks/useFrameSequence';
function MovingPortrait({clip,locale}){
 const section=useRef(null),canvas=useRef(null),base=`/media/stories/${clip.id}`;useFrameSequence(section,canvas,base,'flow');
 return <figure ref={section} className={`story-portrait story-${clip.id}`} data-motion-clip={clip.id}><div className="story-image"><img src={`${base}/poster.webp`} alt={clip[locale]} loading="lazy" decoding="async"/><canvas ref={canvas} aria-hidden="true"/></div><figcaption>{clip[locale]}</figcaption></figure>
}
export default function MotionStory({story}){
 const {locale}=useLocale(),data=motionStories[story],copy=data[locale];
 return <section id={`story-${story}`} className={`motion-story motion-story-${story}`} data-sc-act="flow" aria-labelledby={`story-title-${story}`}>
  <div className="story-intro"><span className="small-note" data-aos="fade-right">{copy.tag}</span><h2 id={`story-title-${story}`} data-aos="fade-up">{copy.title}<br/><em>{copy.accent}</em></h2><p data-aos="fade-left">{copy.body}</p></div>
  <div className="story-portraits">{data.clips.map(clip=><MovingPortrait key={clip.id} clip={clip} locale={locale}/>)}</div>
  <a className="line-link story-link" href="#collection">{copy.link}<ArrowUpRight size={17}/></a>
 </section>
}
