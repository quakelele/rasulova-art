import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),ffmpeg=process.env.SCROLLCRAFT_FFMPEG;
if(!ffmpeg)throw Error('Set SCROLLCRAFT_FFMPEG to the full FFmpeg executable');
const source='public/media/Новая папка',files=fs.readdirSync(source).filter(f=>/\.(jpe?g|png)$/i.test(f)).sort();
const hashes=new Map(),media=[],jobs=[];
fs.mkdirSync('public/media/optimized',{recursive:true});
for(const file of files){const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex');let output=hashes.get(hash);if(!output){output=`optimized/${file.replace(/\.[^.]+$/,'.webp')}`;hashes.set(hash,output);jobs.push({file,output})}media.push(output)}
let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const {file,output}=jobs[cursor++];await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',path.join(source,file),'-vf',"scale='min(1600,iw)':-2:flags=lanczos",'-frames:v','1','-c:v','libwebp','-quality','83',path.join('public/media',output)]);}}));
const groups=[
 ['berry','Ягодный рельеф','Ваза','Графитовый',[34,9,35,43,53]],
 ['lemon','Солнечный круг','Декоративное блюдо','Жёлтый',[]],
 ['citrus','Лимонная форма','Ваза','Жёлтый',[11,5,12,13,15]],
 ['petal','Белые лепестки','Декоративное блюдо','Белый',[55,56,57,58,65,66,67,54]],
 ['red','Красный акцент','Декоративное блюдо','Красный и графитовый',[27,48]],
 ['blue','Голубые лепестки','Декоративное блюдо','Голубой',[26,32,33,30,51]],
 ['black','Тёмный контур','Декоративное блюдо','Графитовый',[41,39,40,61]],
 ['hydrangea','Цветочная форма','Ваза','Голубой',[22,21,23,25,7,8,28,37,44,46,49]],
 ['blueberry','Синяя ягода','Ваза','Синий',[3,2,4,18,19]],
 ['raspberry','Малиновый сад','Ваза','Малиновый',[0,1,10,16,17,20,24,31,42,45,47,52]],
];
const works=groups.map(([id,name,kind,color,indices])=>{const images=[...new Set(indices.map(i=>media[i]))];return{id,name,kind,color,image:images[0],images}});
// Preserve existing saved IDs and their actual original objects.
works.find(w=>w.id==='lemon').kind='Декоративное блюдо';
works.find(w=>w.id==='lemon').images.unshift('photo_2026-09-24_15-43-20.jpg');
works.find(w=>w.id==='lemon').image='photo_2026-09-11_19-17-09.jpg';
works.find(w=>w.id==='red').images.unshift('photo_2026-10-08_22-24-59.jpg');
const atelier=[...new Set([6,29,36,38,50,59,60,62,63,64].map(i=>media[i]))];
fs.writeFileSync('src/media-data.js',`// Generated from the supplied media; titles are descriptive.\nexport const works=${JSON.stringify(works,null,2)};\nexport const atelierMedia=${JSON.stringify(atelier,null,2)};\nexport const detailImage=${JSON.stringify(media[14])};\n`);
const used=new Set([...works.flatMap(w=>w.images),...atelier,media[14]]);
fs.writeFileSync('scrollcraft/media-import.json',JSON.stringify({sourceFiles:files.length,uniqueFiles:hashes.size,duplicates:files.length-hashes.size,optimizedFiles:jobs.length,referencedUniqueFiles:[...hashes.values()].filter(f=>used.has(f)).length,mapping:files.map((file,i)=>({file,asset:media[i]}))},null,2));
const count=fs.readdirSync('public/media/frames/desktop').filter(f=>f.endsWith('.webp')).length;
fs.writeFileSync('public/media/frames/manifest.json',JSON.stringify({count,fps:60,source:'Camera_moving_backward_from_vase_bd1f6868_iris3.mp4',desktop:{width:1280,height:720},mobile:{width:768,height:432}}));
console.log({sourceFiles:files.length,unique:hashes.size,referenced:[...hashes.values()].filter(f=>used.has(f)).length,frames:count});
