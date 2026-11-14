import path from 'node:path';
import fs from 'node:fs';
import {readCatalog} from './read-catalog.mjs';
export default function folderCatalog(){
 const virtual='virtual:folder-catalog',resolved='\0'+virtual;let root,timer;
 return{name:'folder-driven-art-catalog',configResolved(config){root=path.join(config.root,'public/catalog')},resolveId(id){if(id===virtual)return resolved},load(id){if(id===resolved)return `export default ${JSON.stringify(readCatalog(root))};`},configureServer(server){
  fs.mkdirSync(root,{recursive:true});server.watcher.add(root);
  const change=file=>{if(!path.resolve(file).startsWith(root+path.sep)&&path.resolve(file)!==root)return;clearTimeout(timer);timer=setTimeout(()=>{try{readCatalog(root);const module=server.moduleGraph.getModuleById(resolved);if(module)server.moduleGraph.invalidateModule(module);server.ws.send({type:'full-reload',path:'*'})}catch(error){server.ws.send({type:'error',err:{message:error.message,stack:error.stack}})}},180)};
  server.watcher.on('add',change).on('unlink',change).on('change',change).on('addDir',change).on('unlinkDir',change);server.httpServer?.once('close',()=>{clearTimeout(timer);server.watcher.off('add',change).off('unlink',change).off('change',change).off('addDir',change).off('unlinkDir',change)});
 }};
}
