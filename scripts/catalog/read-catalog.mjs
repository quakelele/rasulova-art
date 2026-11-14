import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const imagePattern=/\.(jpe?g|png|webp|avif|gif)$/i;
const collator=new Intl.Collator('ru',{numeric:true,sensitivity:'base'});
export const cleanTitle=name=>name.replace(/\.[^.]+$/,'').replace(/^\d{1,3}[\s._-]+/,'').replace(/__\d+$/,'').replaceAll('_',' ').trim();
const folderTitle=name=>name.replace(/^\d{1,3}[\s._-]+/,'').replaceAll('_',' ').trim();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const idFor=(prefix,value)=>`${prefix}-${hash(value).slice(0,12)}`;
function jsonFile(file){if(!fs.existsSync(file))return{};try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''))}catch(error){throw new Error(`Invalid catalog metadata: ${file}: ${error.message}`)}}
const entries=folder=>fs.readdirSync(folder,{withFileTypes:true}).filter(item=>!item.name.startsWith('.')&&!item.name.startsWith('_')&&!item.isSymbolicLink()).sort((a,b)=>collator.compare(a.name,b.name));
const typeFolder=name=>/^(вазы|конфетницы|vases|candy bowls|вазалар)$/i.test(folderTitle(name));
export function readCatalog(root=path.resolve('public/catalog')){
 if(!fs.existsSync(root))return{categories:[],works:[],aliases:{}};
 const categories=[],works=[],aliases={},ids=new Set();
 for(const directory of entries(root).filter(entry=>entry.isDirectory())){
  const full=path.join(root,directory.name),meta=jsonFile(path.join(full,'section.json')),title=folderTitle(directory.name);
  const category={id:meta.id||idFor('section',directory.name),name:title,title:meta.title||{},description:meta.description||{},key:/дофамин/i.test(title)?'decor':/картин/i.test(title)?'paintings':/артбокс|artbox/i.test(title)?'artbox':'custom',works:[]};
  function addItem(folder,files,workName,identity,groupName=''){
   const itemMeta=jsonFile(path.join(folder,'_item.json'));
   const unique=new Map();files.forEach(file=>{const digest=hash(fs.readFileSync(path.join(folder,file)));if(!unique.has(digest))unique.set(digest,file)});
   const images=[...unique.values()].map(file=>'catalog/'+path.relative(root,path.join(folder,file)).split(path.sep).join('/'));
   if(!images.length)return;
   const kind=itemMeta.kind||(/конфетниц|candy bowl/i.test(workName+' '+groupName)?'Конфетница':/ваза|вазы|vase/i.test(workName+' '+groupName)?'Ваза':category.key==='paintings'?'Интерьерная картина':category.key==='artbox'?'Артбокс':'Авторская работа');
   const id=itemMeta.id||idFor('work',identity);if(ids.has(id))throw new Error(`Duplicate catalog id: ${id}`);ids.add(id);
   const sourcePairs=[...unique.values()].map((file,index)=>({image:images[index],source:itemMeta.sourceFiles?.[file]||(/^\d+\./.test(file)?itemMeta.sourceImages?.[parseInt(file,10)-1]:null)})).filter(pair=>pair.source);
   const work={id,name:workName,kind,color:itemMeta.color||'',image:images[0],images,categoryId:category.id,sourcePairs,categoryKey:category.key};
   category.works.push(work);works.push(work);for(const alias of itemMeta.legacyIds||[])aliases[alias]=id;
  }
  function scan(folder,relative=[]){
   const list=entries(folder),files=list.filter(entry=>entry.isFile()&&imagePattern.test(entry.name)).map(entry=>entry.name);
   const container=relative.length===0||typeFolder(relative.at(-1));
   if(container){const grouped=new Map();for(const file of files){const name=cleanTitle(file);if(!grouped.has(name))grouped.set(name,[]);grouped.get(name).push(file)}for(const[name,views]of grouped)addItem(folder,views,name,`${directory.name}/${relative.join('/')}/${name}`,relative.at(-1)||'')}
   else if(files.length)addItem(folder,files,folderTitle(relative.at(-1)),`${directory.name}/${relative.join('/')}`,relative.at(-2)||'');
   for(const entry of list.filter(entry=>entry.isDirectory()))scan(path.join(folder,entry.name),[...relative,entry.name]);
  }
  scan(full);categories.push(category);
 }
 return{categories,works,aliases};
}
