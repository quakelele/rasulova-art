import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {messages,kindKeys,colorKeys} from './messages';
const Context=createContext(null);
export function LocaleProvider({children}){
 const [locale,setLocale]=useState(()=>{try{const query=new URLSearchParams(location.search).get('lang');const lang=messages[query]?query:localStorage.getItem('rasulova-language');return messages[lang]?lang:'ru'}catch{return 'ru'}});
 useEffect(()=>{document.documentElement.lang=locale;document.title=messages[locale].pageTitle;document.querySelector('meta[name="description"]')?.setAttribute('content',messages[locale].pageDescription);try{localStorage.setItem('rasulova-language',locale)}catch{}},[locale]);
 const value=useMemo(()=>{const t=(key,vars={})=>(messages[locale][key]||messages.ru[key]||key).replace(/\{(\w+)\}/g,(match,k)=>vars[k]??match);return{locale,setLocale,t,kind:value=>t(kindKeys[value]||value),color:value=>t(colorKeys[value]||value),count:n=>`${n} ${t(new Intl.PluralRules(locale).select(n)==='one'?'countOne':new Intl.PluralRules(locale).select(n)==='few'?'countFew':'countMany')}`}},[locale]);
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useLocale=()=>useContext(Context);
