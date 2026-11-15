// Opt-in real-device diagnostic. Not loaded on ordinary visits.
export function mountScrollDiagnostics(){
 const panel=document.createElement('aside');
 panel.setAttribute('aria-label','Диагностика прокрутки');
 panel.style.cssText='position:fixed;z-index:9999;left:8px;bottom:8px;max-width:calc(100vw - 16px);padding:10px 12px;background:#172016f2;color:#fff;font:11px/1.6 monospace;border:1px solid #8b9c80;pointer-events:auto';
 const stats=document.createElement('div'),copy=document.createElement('button'),close=document.createElement('button');
 copy.textContent='Скопировать';close.textContent='Закрыть';
 for(const button of [copy,close])button.style.cssText='color:#fff;font:inherit;border:1px solid #8b9c80;padding:4px 8px;margin:6px 8px 0 0';
 panel.append(stats,copy,close);document.body.append(panel);
 let raf=0,last=0,intervals=[],longTasks=0,report={};
 const observer=typeof PerformanceObserver!=='undefined'&&PerformanceObserver.supportedEntryTypes?.includes('longtask')?new PerformanceObserver(entries=>{longTasks+=entries.getEntries().length}):null;
 observer?.observe({type:'longtask'});
 function frame(time){if(last&&document.visibilityState==='visible'){intervals.push(time-last);if(intervals.length>240)intervals.shift()}last=time;raf=requestAnimationFrame(frame)}
 const timer=setInterval(()=>{
  const values=[...intervals].sort((a,b)=>a-b),mean=values.reduce((sum,n)=>sum+n,0)/Math.max(1,values.length);
  report={userAgent:navigator.userAgent,bundle:document.querySelector('script[type="module"][src]')?.getAttribute('src'),scrollEngine:matchMedia('(pointer:coarse), (max-width:700px)').matches?'native':'lenis',jsCadenceHz:mean?Math.round(1000/mean):null,p95FrameMs:values[Math.floor(values.length*.95)]||0,longTasks,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,scrollY:Math.round(scrollY),touch:matchMedia('(pointer:coarse)').matches};
  stats.textContent=`JS: ${report.jsCadenceHz??'…'} Гц (не FPS экрана) · p95: ${report.p95FrameMs.toFixed(1)} мс\nДлинные задачи: ${longTasks} · Y: ${report.scrollY}\n${innerWidth}×${innerHeight} · DPR ${devicePixelRatio}`;
  stats.style.whiteSpace='pre-wrap';
 },750);
 copy.onclick=async()=>{try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));copy.textContent='Скопировано'}catch{copy.textContent='Буфер недоступен'}};
 close.onclick=()=>{clearInterval(timer);cancelAnimationFrame(raf);observer?.disconnect();panel.remove()};
 raf=requestAnimationFrame(frame);
}
