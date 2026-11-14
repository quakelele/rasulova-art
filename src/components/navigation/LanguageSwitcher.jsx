import React from 'react';
import {useLocale} from '../../i18n/LocaleProvider';
export default function LanguageSwitcher(){const{locale,setLocale}=useLocale();return <div className="language-switcher" role="group" aria-label="Language / Язык / Dil">{[['ru','Русский'],['en','English'],['az','Azərbaycan dili']].map(([code,label])=><button key={code} lang={code} title={label} aria-label={label} aria-pressed={locale===code} onClick={()=>setLocale(code)}>{code.toUpperCase()}</button>)}</div>}
