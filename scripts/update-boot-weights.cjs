'use strict';
// Weights describe completed resources, not streamed/compressed network bytes.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../xiantu-v2831-scroll'),file=path.join(root,'game-v2762.html');
let html=fs.readFileSync(file,'utf8');
const files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const weights=Object.fromEntries(files.map(name=>[name,fs.statSync(path.join(root,name)).size]));
html=html.replace(/var sizesV286891=\{[^;]*\},cssSizeV286891=\d+;/,'var sizesV286891='+JSON.stringify(weights)+',cssSizeV286891='+fs.statSync(path.join(root,'xiantu-v2762.css')).size+';');
fs.writeFileSync(file,html);console.log('Updated '+files.length+' script weights and stylesheet size');
