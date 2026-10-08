(()=>{
 const $=id=>document.getElementById(id),D=HeartFirePreview.definition,stage=$('stage'),nodes=new Map(),tails=new Map();
 let age=0,playing=false,last=0,lastDraw=0,raf=0,ready=false;
 const options=()=>({quality:$('quality').value,hit:$('hit').checked,scale:Number($('scale').value)||1,offsetX:Number($('offsetX').value)||0,offsetY:Number($('offsetY').value)||0});
 function render(){
  const parts=HeartFirePreview.sample(age,options());nodes.forEach(n=>n.hidden=true);tails.forEach(n=>n.hidden=true);
  for(const p of parts){
   let el=nodes.get(p.id);if(!el){el=document.createElement('div');el.className='sprite';el.dataset.layer=p.layer;el.dataset.id=p.id;stage.appendChild(el);nodes.set(p.id,el)}
   const layer=D.layers[p.layer];el.hidden=false;
   Object.assign(el.style,{left:(p.x-p.width*p.pivotX)+'px',top:(p.y-p.height*p.pivotY)+'px',width:p.width+'px',height:p.height+'px',opacity:p.opacity,backgroundImage:`url('${layer.file}')`,backgroundSize:`${layer.frames*p.width}px ${p.height}px`,backgroundPosition:`${-p.frame*p.width}px 0`,transform:`rotate(${p.rotation}rad)`});el.style.setProperty('--px',p.pivotX*100+'%');el.style.setProperty('--py',p.pivotY*100+'%');
   if(p.trail){let tail=tails.get(p.id);if(!tail){tail=document.createElement('div');tail.className='trail';stage.insertBefore(tail,stage.firstChild);tails.set(p.id,tail)}tail.hidden=false;Object.assign(tail.style,{left:p.x-p.trail+'px',top:p.y+'px',width:p.trail+'px',opacity:p.opacity*.45,transform:`rotate(${(p.rotation-.8)*.3}rad)`})}
  }
  $('time').value=age;$('phase').textContent=(age<95?'凝心蓄炎':age<310?'赤黑贯心':age<490?'焚脉烙印':age<850?'余烬消散':'结束')+' · '+Math.round(age)+' ms'+(options().hit?'':' · 未命中');
  $('layers').textContent=parts.map(p=>`${p.id}: ${p.anchor} frame=${p.frame} alpha=${p.opacity.toFixed(2)} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)}`).join('\n');return parts;
 }
 function pause(){playing=false;$('play').textContent='播放';cancelAnimationFrame(raf);raf=0}
 function tick(now){raf=0;if(!playing||document.hidden)return;age+=Math.min(80,now-last)*Number($('speed').value);last=now;if(age>900){if($('loop').checked)age=0;else{age=900;pause()}}if(now-lastDraw>=1000/Number($('fps').value)||!playing){render();lastDraw=now}if(playing)raf=requestAnimationFrame(tick)}
 function start(){if(playing||!ready)return;if(age>=900)age=0;playing=true;last=performance.now();lastDraw=0;$('play').textContent='暂停';raf=requestAnimationFrame(tick)}
 $('play').onclick=()=>playing?pause():start();$('restart').onclick=()=>{pause();age=0;render();start()};$('step').onclick=()=>{pause();age=Math.min(900,age+1000/Number($('fps').value));render()};$('time').oninput=()=>{pause();age=Number($('time').value);render()};
 for(const id of ['quality','hit','scale','offsetX','offsetY'])$(id).onchange=render;
 $('background').onchange=()=>{stage.style.background=$('background').value==='stage'?'':$('background').value==='light'?'#eee7d2':'#10212d'};
 $('reset').onclick=()=>{pause();age=0;for(const [id,value] of Object.entries({quality:'rich',background:'stage',speed:'1',fps:'30',scale:'1',offsetX:'0',offsetY:'0'}))$(id).value=value;$('hit').checked=true;$('loop').checked=true;stage.style.background='';render()};
 function resize(){stage.style.transform=`scale(${$('viewport').clientWidth/720})`}addEventListener('resize',resize);new ResizeObserver(resize).observe($('viewport'));document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});addEventListener('pagehide',pause);resize();render();
 window.heartFirePreview={seek(t){pause();age=t;return render()},get age(){return age},get playing(){return playing},get ready(){return ready},options};
 Promise.all([...Object.values(D.layers).map(meta=>[meta.file,meta.frames*meta.frameWidth,meta.frameHeight]),['stage-reference.webp',0,0]].map(([file,w,h])=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>!w||(im.naturalWidth===w&&im.naturalHeight===h)?resolve():reject(Error('素材尺寸错误：'+file));im.onerror=()=>reject(Error('素材加载失败：'+file));im.src=file}))).then(()=>{ready=true;for(const id of ['play','restart','step'])$(id).disabled=false}).catch(e=>{pause();$('error').textContent=e.message});
})();
