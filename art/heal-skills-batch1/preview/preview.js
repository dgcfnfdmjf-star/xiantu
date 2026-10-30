'use strict';
const defs=window.HealBatchDefinitions,$=id=>document.getElementById(id),layers=new Map(),errors=new Map();let age=0,playing=true,previous=performance.now(),ready=false,failed='';
for(const d of defs){const option=document.createElement('option');option.value=d.key;option.textContent=d.name;$('skill').append(option)}
const load=L=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>im.naturalWidth===L.frames*L.frameWidth&&im.naturalHeight===L.frameHeight?resolve():reject(Error('图集尺寸不符：'+L.file));im.onerror=()=>reject(Error('资源加载失败：'+L.file));im.src=L.file});
Promise.all(defs.map(async d=>{try{await Promise.all(Object.values(d.layers).map(load))}catch(e){errors.set(d.key,e.message)}})).then(()=>{ready=true;draw()});
function reset(){age=0;draw()}
function draw(){
 const d=defs.find(d=>d.key===$('skill').value),ratio={dew_return:.15,spring_return:.3,verdant_bloom:.5}[d.key],amount=$('heal').checked?Math.floor(720*ratio):0;
 const j={fromGround:{x:245,y:302},actualHeal:amount,scale:Number($('scale').value),reduced:$('reduced').checked,exited:$('cancel').checked};
 failed=errors.get(d.key)||'';const parts=failed?[]:sampleHealBatch(d,j,age),visible=new Set();
 for(const p of parts){const L=d.layers[p.layer],id=d.key+':'+p.id;visible.add(id);let el=layers.get(id);if(!el){el=document.createElement('div');el.className='layer';$('effects').append(el);layers.set(id,el)}Object.assign(el.style,{display:'block',width:p.width+'px',height:p.height+'px',backgroundImage:`url("${L.file}")`,backgroundSize:`${p.width*L.frames}px ${p.height}px`,backgroundPosition:`${-p.frame*p.width}px 0`,opacity:p.opacity,transform:`translate(${p.x+Number($('x').value)}px,${p.y-85+Number($('y').value)}px) translate(${-p.width*p.pivotX}px,${-p.height*p.pivotY}px)`});}
 for(const [id,el] of layers)if(!visible.has(id))el.style.display='none';
 const hp=$('heal').checked?200+amount:720;$('hpFill').style.width=(hp/720*100)+'%';$('hpText').textContent=`模拟 ${hp}/720`;$('ratio').textContent=`一次恢复 ${ratio*100}% 最大气血 · 模拟实际恢复 ${amount}`;
 $('status').textContent=failed||(!ready?'正在加载透明素材…':`${d.name} · ${Math.round(age)} ms · ${parts.map(p=>p.id+':'+p.opacity.toFixed(2)).join(' / ')||'已清场'}`);
}
function resize(){const stage=document.querySelector('.stage'),viewport=document.querySelector('.viewport'),s=Math.min(1,viewport.clientWidth/720);stage.style.transform=`scale(${s})`;viewport.style.height=420*s+'px'}
window.addEventListener('resize',resize);resize();$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放'};$('restart').onclick=reset;$('step').onclick=()=>{playing=false;$('play').textContent='播放';age+=1000/Number($('fps').value);draw()};$('skill').onchange=()=>{$('scale').value=1;$('x').value=0;$('y').value=0;reset()};for(const id of ['reduced','scale','x','y','heal','cancel'])$(id).oninput=draw;
 $('bg').onchange=()=>{document.querySelector('.stage').style.background=$('bg').value==='stage'?'url(stage-reference.webp) center/100% 100%':$('bg').value};
let lastDraw=0;function tick(now){const dt=Math.min(80,now-previous);previous=now;const d=defs.find(d=>d.key===$('skill').value);if(playing&&ready&&!document.hidden){age+=dt*Number($('speed').value);if(age>d.timing.durationMs+600&&$('loop').checked)age=0;}if(now-lastDraw>=1000/Number($('fps').value)){draw();lastDraw=now;}requestAnimationFrame(tick)}requestAnimationFrame(tick);
window.HealPreview={seek(t){age=t;playing=false;$('play').textContent='播放';draw()},inspect:()=>({ready,failed,age,effects:defs.length,errors:[...errors]})};
