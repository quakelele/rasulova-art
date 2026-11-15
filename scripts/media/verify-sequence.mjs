import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const ffmpeg=process.argv[2];
if(!ffmpeg)throw new Error('Pass the FFmpeg executable path.');
const run=promisify(execFile),base=path.resolve(process.argv[3]||'public/media/hero-last');
const manifest=JSON.parse(fs.readFileSync(path.join(base,'manifest.json'),'utf8').replace(/^\uFEFF/,''));
const options={maxBuffer:4*1024*1024,windowsHide:true};
const common=['-hide_banner','-loglevel','error'];
const hashes=text=>text.split(/\r?\n/).filter(line=>line&&!line.startsWith('#')).map(line=>line.split(',').at(-1).trim());
const [original,converted]=await Promise.all([
 run(ffmpeg,[...common,'-i',path.resolve(manifest.source),'-map','0:v:0','-vf','format=bgra','-fps_mode','passthrough','-c:v','rawvideo','-f','framemd5','-'],options),
 run(ffmpeg,[...common,'-framerate',manifest.fps,'-i',path.join(base,'frames/frame-%03d.webp'),'-vf','format=bgra','-c:v','rawvideo','-f','framemd5','-'],options)
]);
const sourceHashes=hashes(original.stdout),webpHashes=hashes(converted.stdout);
assert.equal(sourceHashes.length,manifest.count);
assert.deepEqual(webpHashes,sourceHashes,'Every decoded frame must match the source RGB pixels');
const frames=fs.readdirSync(path.join(base,'frames')).filter(file=>/^frame-\d+\.webp$/.test(file));
const bytes=frames.reduce((sum,file)=>sum+fs.statSync(path.join(base,'frames',file)).size,0);
const result={source:manifest.source,frames:frames.length,width:manifest.width,height:manifest.height,fps:manifest.fps,matchingFrameHashes:sourceHashes.length,lossless:true,bytes};
fs.mkdirSync('artifacts/qa/hero-replacement',{recursive:true});
fs.writeFileSync('artifacts/qa/hero-replacement/lossless-verification.json',JSON.stringify(result,null,2));
console.log(result);
