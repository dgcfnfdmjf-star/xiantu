'use strict';
// Encode generated sources without repainting them; source rectangles are runtime atlas metadata.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),src=path.join(root,'art/interior-painted-v286892'),out=path.join(root,'xiantu-v2831-scroll/interior-painted-v286892');
const frames={bed:[0,100,438,314],desk:[439,100,432,314],book:[930,0,310,429],furnace:[40,415,345,493],throne:[404,430,474,466],pillar:[980,425,200,479],cushion:[45,940,340,290],redRug:[407,898,454,345],jadeRug:[866,898,370,345]};
(async()=>{fs.mkdirSync(out,{recursive:true});for(const name of ['room','props'])await sharp(path.join(src,name+'-source.png')).webp({quality:86,alphaQuality:100}).toFile(path.join(out,name+'.webp'));
const meta=await sharp(path.join(src,'props-source.png')).metadata();for(const [name,[x,y,w,h]]of Object.entries(frames)){if(x<0||y<0||x+w>meta.width||y+h>meta.height)throw Error(name+' outside atlas');}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({version:1,room:{width:1448,height:1086},props:{width:1254,height:1254,frames}},null,2)+'\n');console.log('Encoded two textures; validated nine source rectangles');})();
