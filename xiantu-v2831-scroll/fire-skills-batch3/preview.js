(()=>{
 const $=id=>document.getElementById(id),defs=window.FireBatch3Definitions??[],stage=$('stage'),nodes=new Map(),errors=new Map();
 let age=0,playing=false,last=0,lastDraw=0,raf=0,loaded=false;
 for(const d of defs)$('effect').add(new Option(d.name,d.key));
 const definition=()=>defs.find(d=>d.key===$('effect').value);
 const options=()=>({light:$('quality').value==='light',reduced:$('quality').value==='reduced',hitAt:$('hit').checked?+$('arrival').value:null,arriveAt:+$('arrival').value,alive:$('burnState').value!=='dead',sameTarget:$('burnState').value!=='changed',burn:{burnTurns:['expired','detonated'].includes($('burnState').value)?0:3,burnStacks:$('burnState').value==='detonated'?0:100,_burnHealBlockV286818:$('burnState').value==='lotus'},domainConfirmed:$('burnState').value!=='ordinary',scale:+$('scale').value||1,offsetX:+$('offsetX').value||0,offsetY:+$('offsetY').value||0,from:{x:290,y:205},to:{x:493,y:250},toGround:{x:493,y:278}});
 const ready=()=>loaded&&!!definition()&&!errors.has(definition().key);
 function render(){
  const D=definition(),parts=ready()?sampleFireBatch3(D,options(),age):[];nodes.forEach(n=>n.hidden=true);
  for(const p of parts){let el=nodes.get(p.id);if(!el){el=document.createElement('div');el.className='sprite';el.dataset.layer=p.layer;stage.appendChild(el);nodes.set(p.id,el)}const L=D.layers[p.layer];el.hidden=false;Object.assign(el.style,{left:(p.x-p.width*p.pivotX)+'px',top:(p.y-p.height*p.pivotY)+'px',width:p.width+'px',height:p.height+'px',opacity:p.opacity,backgroundImage:`url('${L.file}')`,backgroundSize:`${L.frames*p.width}px ${p.height}px`,backgroundPosition:`${-p.frame*p.width}px 0`,clipPath:p.clipEnd===undefined?'none':`inset(0 ${(1-p.clipEnd)*100}% 0 ${p.clipStart*100}%)`,transform:`rotate(${p.rotation}rad)`,transformOrigin:`${p.pivotX*100}% ${p.pivotY*100}%`})}
  $('time').value=age;$('phase').textContent=(D?.name??'资源错误')+' · '+Math.round(age)+' ms'+(options().hitAt===null?' · 未命中':'');
  $('layers').textContent=parts.map(p=>`${p.layer} · ${p.anchor} · frame ${p.frame} · alpha ${p.opacity.toFixed(2)}`).join('\n');
  $('error').textContent=errors.get(D?.key)??(!defs.length?'缺少技能配置：请重新运行构建脚本。':'');
  for(const id of ['play','restart','step'])$(id).disabled=!ready();return parts;
 }
 function pause(){playing=false;$('play').textContent='播放';cancelAnimationFrame(raf);raf=0}
 function tick(now){if(!playing)return;age+=Math.min(80,now-last)*+$('speed').value;last=now;if(age>=2400){if($('loop').checked)age=0;else{age=2400;pause()}}if(now-lastDraw>=1000/+$('fps').value||!playing){render();lastDraw=now}if(playing)raf=requestAnimationFrame(tick)}
 function start(){if(playing||!ready())return;if(age>=2400)age=0;playing=true;last=performance.now();lastDraw=0;$('play').textContent='暂停';raf=requestAnimationFrame(tick)}
 function reset(){pause();age=0;for(const [id,v]of Object.entries({quality:'rich',background:'stage',speed:'1',fps:'30',scale:'1',offsetX:'0',offsetY:'0',arrival:'310'}))$(id).value=v;$('hit').checked=true;$('burnState').value='active';$('loop').checked=true;$('burnState').disabled=definition()?.key!=='wildfire_domain';stage.style.background='';render()}
 $('play').onclick=()=>playing?pause():start();$('restart').onclick=()=>{pause();age=0;render();start()};$('step').onclick=()=>{pause();age=Math.min(2400,age+1000/+$('fps').value);render()};$('time').oninput=()=>{pause();age=+$('time').value;render()};
 for(const id of ['quality','hit','burnState','scale','offsetX','offsetY','arrival'])$(id).onchange=render;
 $('background').onchange=()=>{stage.style.background=$('background').value==='stage'?'':$('background').value==='light'?'#eee7d2':'#10212d'};$('reset').onclick=reset;$('effect').onchange=reset;
 function resize(){stage.style.transform=`scale(${$('viewport').clientWidth/720})`}addEventListener('resize',resize);new ResizeObserver(resize).observe($('viewport'));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});addEventListener('pagehide',pause);
 window.fireBatch3Preview={seek(t){pause();age=t;return render()},get age(){return age},get playing(){return playing},get ready(){return ready()},get errors(){return Object.fromEntries(errors)},options,definition};
 Promise.all(defs.map(async D=>{try{for(const key of ['telegraph','body','impact','residue'])if(!D.layers?.[key])throw Error('缺少 '+key+' 配置');await Promise.all(Object.values(D.layers).map(L=>new Promise((resolve,reject)=>{if(!Number.isInteger(L.frames)||L.frames<4)return reject(Error('动画帧数不足：'+L.file));const im=new Image();im.onload=()=>im.naturalWidth===L.frames*L.frameWidth&&im.naturalHeight===L.frameHeight?resolve():reject(Error('图集尺寸错误：'+L.file));im.onerror=()=>reject(Error('素材加载失败：'+L.file));im.src=L.file})));}catch(e){errors.set(D.key,e.message+'；请重新构建该技能资源。')}})).then(()=>{loaded=true;render()});resize();reset();
})();
