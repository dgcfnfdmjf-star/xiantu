'use strict';
const defs=Array.isArray(window.HealGuardDefinitions)?window.HealGuardDefinitions:[],$=id=>document.getElementById(id),layers=new Map(),errors=new Map();
let age=0,playing=true,previous=performance.now(),ready=false,failed='',lastParts=[];
for(const d of defs){const o=document.createElement('option');o.value=d.key;o.textContent=d.name;$('skill').append(o)}
const load=L=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>im.naturalWidth===L.frames*L.frameWidth&&im.naturalHeight===L.frameHeight?resolve():reject(Error('图集尺寸不符：'+L.file));im.onerror=()=>reject(Error('资源加载失败：'+L.file));im.src=L.file});
function validate(d){
 if(d.visualArchetype!=='shield-orbit'||!(d.timing?.durationMs>0&&d.timing.guardLoopMs>0&&d.timing.consumeMs>0))throw Error(d.name+'：动画类型或时长无效');
 for(const name of ['telegraph','body','impact','residue','guard','consume']){const l=d.layers?.[name];if(!l?.file||!Number.isInteger(l.frames)||l.frames<(['guard','body'].includes(name)?8:4)||!(l.frameWidth>0&&l.frameHeight>0)||!(d.display?.[name]>0))throw Error(d.name+'/'+name+'：图集字段不完整');
  if(['telegraph','body','impact','residue'].includes(name)){const w=d.preview?.layers?.[name];if(!w||w.anchor!=='origin'||!(w.end>w.start))throw Error(d.name+'/'+name+'：时间或锚点无效');}
 }
}
Promise.all(defs.map(async d=>{try{validate(d);await Promise.all(Object.values(d.layers).map(load))}catch(e){errors.set(d.key,e.message+'；请重新导出该技能资源。')}})).then(()=>{ready=true;draw()});
function draw(){
 const d=defs.find(d=>d.key===$('skill').value);if(!d){lastParts=[];$('status').textContent='未找到有效特效清单，请重新导出 definition.js。';return;}
 const before=$('heal').checked?200:720,amount=Math.min(720-before,Math.floor(720*(d.key==='jade_heart_guard'?.25:.6))),scenario=$('scenario').value;
 const j={fromGround:{x:245,y:302},actualHeal:amount,guardOwned:$('guard').checked,guardConsumedAt:scenario==='hit'?1600:scenario==='early'?300:undefined,guardReplacedAt:scenario==='replace'?1000:undefined,scale:Number($('scale').value),reduced:$('reduced').checked,light:$('quality').value==='low',exited:$('cancel').checked};
 failed=errors.get(d.key)||'';const parts=failed?[]:sampleHealGuard(d,j,age),visible=new Set();lastParts=parts;
 for(const p of parts){const L=d.layers[p.layer],id=d.key+':'+p.id;visible.add(id);let el=layers.get(id);if(!el){el=document.createElement('div');el.className='layer';$('effects').append(el);layers.set(id,el)}Object.assign(el.style,{display:'block',width:p.width+'px',height:p.height+'px',backgroundImage:`url("${p.file}")`,backgroundSize:`${p.width*L.frames}px ${p.height}px`,backgroundPosition:`${-p.frame*p.width}px 0`,opacity:p.opacity,transform:`translate(${p.x+Number($('x').value)}px,${p.y-85+Number($('y').value)}px) translate(${-p.width*p.pivotX}px,${-p.height*p.pivotY}px)`});}
 for(const [id,el] of layers)if(!visible.has(id))el.style.display='none';
 const hp=before+amount;$('hpFill').style.width=(hp/720*100)+'%';$('hpText').textContent=`模拟 ${hp}/720`;$('ratio').textContent=`模拟恢复 ${amount} 气血 · 本次${j.guardOwned?'建立':'未替换'}护持`;
 $('status').textContent=failed||(!ready?'正在加载透明素材…':`${d.name} · ${Math.round(age)} ms · ${parts.map(p=>p.id+':'+p.opacity.toFixed(2)).join(' / ')||'已清场'}`);
}
function reset(){age=0;draw()}
function resize(){const s=Math.min(1,document.querySelector('.viewport').clientWidth/720);document.querySelector('.stage').style.transform=`scale(${s})`;document.querySelector('.viewport').style.height=420*s+'px'}
window.addEventListener('resize',resize);resize();$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停':'播放'};$('restart').onclick=reset;$('step').onclick=()=>{playing=false;$('play').textContent='播放';age+=1000/Number($('fps').value);draw()};$('skill').onchange=()=>{$('scale').value=1;$('x').value=0;$('y').value=0;reset()};for(const id of ['reduced','scale','x','y','heal','guard','cancel','quality','scenario'])$(id).oninput=draw;
const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(motion?.matches)$('reduced').checked=true;motion?.addEventListener?.('change',e=>{$('reduced').checked=e.matches;draw()});
$('bg').onchange=()=>{document.querySelector('.stage').style.background=$('bg').value==='stage'?'url(stage-reference.webp) center/100% 100%':$('bg').value};
let lastDraw=0;function tick(now){const dt=Math.min(80,now-previous);previous=now;if(playing&&ready&&!document.hidden){age+=dt*Number($('speed').value);if(age>3000&&$('loop').checked)age=0;}if(now-lastDraw>=1000/Number($('fps').value)){draw();lastDraw=now;}requestAnimationFrame(tick)}requestAnimationFrame(tick);
window.HealGuardPreview={seek(t){age=t;playing=false;$('play').textContent='播放';draw()},inspect:()=>({ready,failed,age,playing,parts:lastParts,effects:defs.length,errors:[...errors]})};
