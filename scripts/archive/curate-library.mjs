import fs from 'node:fs';
import {works as importedWorks,atelierMedia} from '../src/media-data.js';
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const audit=readJson('scrollcraft/photo-audit.json'),mapping=readJson('scrollcraft/media-import.json').mapping;
const assets=new Map(mapping.map(r=>[`Новая папка/${r.file}`,r.asset]));
const unique=[],aliases=new Map(),removed=[];
const unrelated='Новая папка/photo_2026-08-02_11-25-58.jpg';
for(const photo of audit){
 const asset=assets.get(photo.file)||photo.file;
 if(photo.file===unrelated){removed.push({file:photo.file,reason:'Ingredient reference, not artwork'});continue}
 const rgb=Buffer.from(photo.rgb,'base64');
 const same=unique.find(other=>{if(other.hash===photo.hash)return true;if(Math.abs(other.width/other.height-photo.width/photo.height)>.02)return false;const distance=[...photo.visual].filter((v,i)=>v!==other.visual[i]).length;if(distance>3)return false;return rgb.reduce((sum,v,i)=>sum+Math.abs(v-other.pixels[i]),0)/rgb.length<1});
 if(same){aliases.set(asset,same.asset);removed.push({file:photo.file,canonical:same.file,reason:same.hash===photo.hash?'Exact duplicate':'Same photograph, different encoding'});continue}
 unique.push({...photo,asset,pixels:rgb});aliases.set(asset,asset);
}
const canonical=image=>aliases.get(image)||image;
const works=importedWorks.map(w=>({...w,image:canonical(w.image),images:[...new Set([w.image,...w.images].map(canonical))]}));
const rootGroups={
 berry:['photo_2026-08-28_22-56-15.jpg','photo_2026-08-28_22-56-38.jpg','photo_2026-08-30_14-34-37.jpg','photo_2026-09-24_15-42-32.jpg','photo_2026-09-24_15-42-57.jpg'],
 lemon:['photo_2026-09-11_19-17-01.jpg','photo_2026-09-11_19-17-09.jpg','photo_2026-09-11_19-17-11.jpg','photo_2026-09-24_15-43-20.jpg'],
 raspberry:['photo_2026-08-28_22-56-42.jpg'],
 black:['photo_2026-08-30_14-34-56.jpg','photo_2026-09-24_15-43-22.jpg'],
 red:['photo_2026-09-11_19-17-21.jpg','photo_2026-10-08_22-24-59.jpg'],
 blue:['photo_2026-09-24_15-43-24.jpg'],petal:['photo_2026-09-24_15-43-18.jpg']
};
for(const work of works){work.images=[...new Set([...work.images,...(rootGroups[work.id]||[])].map(canonical))]}
works.push({id:'terra',name:'Тёплый рельеф',kind:'Ваза',color:'Терракотовый',image:'photo_2026-08-28_22-56-40.jpg',images:['photo_2026-08-28_22-56-40.jpg']});
const owners=new Map();works.forEach(work=>work.images.forEach(image=>{if(!owners.has(image))owners.set(image,work)}));
const photos=unique.map((photo,i)=>{const work=owners.get(photo.asset);return{id:`photo-${String(i+1).padStart(3,'0')}`,isPhoto:true,image:photo.asset,name:work?.name||'В мастерской',kind:work?.kind||'Фотоистория',color:work?.color||'RASULOVA ART',workId:work?.id||null}});
const atelier=[...new Set(atelierMedia.map(canonical))];
fs.writeFileSync('src/curated-media.js',`// Curated from both supplied folders; re-encoded duplicate photos removed.\nexport const works=${JSON.stringify(works,null,2)};\nexport const allPhotos=${JSON.stringify(photos,null,2)};\nexport const atelierMedia=${JSON.stringify(atelier,null,2)};\n`);
fs.writeFileSync('scrollcraft/curation-report.json',JSON.stringify({inputPhotos:audit.length,uniqueArtworkAndStudioPhotos:photos.length,works:works.length,removed},null,2));
console.log({input:audit.length,photos:photos.length,works:works.length,removed:removed.length});
