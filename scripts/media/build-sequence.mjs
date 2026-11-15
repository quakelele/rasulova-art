import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const run=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ffmpeg=process.argv[2];
if(!ffmpeg)throw new Error('Pass the FFmpeg executable path.');
const source=path.resolve(root,process.argv[4]||'lastVideo.mp4'),target=path.resolve(root,process.argv[5]||'public/media/hero-last');
const stage=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'artifacts/media-build',`hero-last-${Date.now()}`);
function inside(parent,child){const rel=path.relative(parent,child);if(rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Media path outside the project')}
inside(root,source);inside(root,target);inside(path.join(root,'artifacts/media-build'),stage);
if(fs.existsSync(target))throw Error('Target already exists. Remove it explicitly before rebuilding.');
const framesPath=path.join(stage,'frames');fs.mkdirSync(framesPath,{recursive:true});
const probe=path.join(path.dirname(ffmpeg),'ffprobe.exe'),options={windowsHide:true,maxBuffer:4*1024*1024};
const {stdout}=await run(probe,['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,avg_frame_rate,nb_read_frames,duration','-of','json',source],options);
const video=JSON.parse(stdout).streams[0],count=Number(video.nb_read_frames);
const existing=fs.readdirSync(framesPath).filter(file=>/^frame-\d+\.webp$/.test(file)).sort();
// Re-encode the last existing frame too, in case a stopped process was writing it.
const start=Math.max(0,existing.length-1),workers=3,block=Math.ceil((count-start)/workers);
await Promise.all(Array.from({length:workers},async(_,worker)=>{
 const first=start+worker*block,last=Math.min(count-1,first+block-1);if(first>=count)return;
 // Select disjoint original-frame ranges. Together they preserve every frame,
 // original dimensions and RGB pixels; no interpolation or resizing is used.
 await run(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',source,'-map','0:v:0','-an','-vf',`select=between(n\\,${first}\\,${last}),format=bgra`,'-fps_mode','passthrough','-frames:v',String(last-first+1),'-c:v','libwebp','-lossless','1','-quality','100','-compression_level','6','-start_number',String(first),path.join(framesPath,'frame-%03d.webp')],options);
 console.log(`Lossless frames ${first}-${last} completed.`);
}));
const frames=fs.readdirSync(framesPath).filter(file=>/^frame-\d+\.webp$/.test(file));
if(frames.length!==count)throw Error('Frame count differs from the source.');
const manifest={count,fps:video.avg_frame_rate,duration:Number(video.duration),source:path.basename(source),sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),width:video.width,height:video.height,encoding:'webp-lossless',frameDirectory:'frames',poster:'frames/frame-000.webp',direction:'forward',resized:false,frameRateChanged:false};
fs.writeFileSync(path.join(stage,'manifest.json'),JSON.stringify(manifest,null,2));
const bytes=frames.reduce((sum,file)=>sum+fs.statSync(path.join(framesPath,file)).size,0);
// Both resolved directory paths were verified above before this directory move.
try{fs.renameSync(stage,target)}catch(error){
 if(!['EPERM','EACCES','EXDEV'].includes(error.code))throw error;
 // OneDrive can hold directory handles while syncing. Copying the validated
 // stage still publishes the complete files without replacing an existing target.
 fs.cpSync(stage,target,{recursive:true,errorOnExist:true,force:false});
}
console.log({frames:count,width:video.width,height:video.height,fps:video.avg_frame_rate,lossless:true,bytes});
