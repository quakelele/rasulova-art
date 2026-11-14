import fs from 'node:fs';
for(const file of ['src/data/catalog.js','src/data/raw-import.js']){
 let source=fs.readFileSync(file,'utf8').replaceAll('optimized/','images/');
 source=source.replace(/"(photo_[^"]+)\.jpg"/g,'"images/$1.webp"');
 fs.writeFileSync(file,source);
}
