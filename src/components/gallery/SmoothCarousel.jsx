import React,{useEffect,useRef} from 'react';
import {useReducedMotion} from 'framer-motion';
import {Swiper} from 'swiper/react';
import {Navigation,Pagination,Keyboard,A11y,FreeMode,Mousewheel} from 'swiper/modules';
import 'swiper/css/free-mode';
import {useLocale} from '../../i18n/LocaleProvider';

const modules=[Navigation,Pagination,Keyboard,A11y,FreeMode,Mousewheel];
const focusableFields='input, select, option, textarea, video, label';

export default function SmoothCarousel({children,className='',...props}){
 const reduced=useReducedMotion();
 const {t}=useLocale();
 const instance=useRef(null);
 useEffect(()=>{const keyboard=instance.current?.keyboard;if(!keyboard)return;if(props.keyboard?.enabled===false)keyboard.disable();else keyboard.enable()},[props.keyboard?.enabled]);
 return <Swiper {...props} a11y={{prevSlideMessage:t('prev'),nextSlideMessage:t('next'),slideLabelMessage:t('slideLabel'),...props.a11y,scrollOnFocus:false}} className={`smooth-carousel ${className}`} modules={modules}
  speed={reduced?0:560} followFinger touchRatio={1} threshold={4} touchAngle={45}
  resistanceRatio={.6} touchStartPreventDefault={false} focusableElements={focusableFields}
  preventClicks preventClicksPropagation grabCursor simulateTouch
  lazyPreloadPrevNext={1}
  freeMode={{enabled:!reduced,sticky:true,momentum:true,momentumRatio:.65,momentumVelocityRatio:.8,momentumBounce:false,minimumVelocity:.015}}
  mousewheel={{forceToAxis:true,releaseOnEdges:true,sensitivity:.8}}
  onPointerDownCapture={event=>{if(event.pointerType==='mouse')event.target.closest('button,a')?.focus({preventScroll:true})}}
  onSwiper={swiper=>{instance.current=swiper;props.onSwiper?.(swiper)}}
  onSliderFirstMove={swiper=>swiper.el.classList.add('is-dragging')}
  onTouchEnd={swiper=>swiper.el.classList.remove('is-dragging')}
  onTransitionEnd={swiper=>swiper.el.classList.remove('is-dragging')}
 >{children}</Swiper>
}
