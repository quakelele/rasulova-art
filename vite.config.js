import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import folderCatalog from './scripts/catalog/vite-plugin.mjs';
export default defineConfig({
 plugins:[react(),folderCatalog()],
 server:{host:'127.0.0.1'},
 preview:{host:'127.0.0.1'},
 build:{rollupOptions:{onwarn(warning,warn){if(warning.code==='MODULE_LEVEL_DIRECTIVE'&&warning.message.includes('use client'))return;warn(warning)}}}
});
