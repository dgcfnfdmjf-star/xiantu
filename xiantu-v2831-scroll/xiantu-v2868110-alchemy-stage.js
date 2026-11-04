/* Optional alchemy presentation, adapted from the user's xiantu-alchemy-demo.html.
 * No recipe calculations, consumptions, reward rolls or save writes live here. */
(function(){
'use strict';
let loading=null;
function loadThree(){
 if(window.THREE&&String(window.THREE.REVISION)==='128')return Promise.resolve(window.THREE);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');let done=false;
  const finish=error=>{if(done)return;done=true;clearTimeout(timer);script.onload=script.onerror=null;if(error){script.remove();reject(error);}else resolve(window.THREE);};
  const timer=setTimeout(()=>finish(new Error('three timeout')),8000);
  script.src='./vendor/three-r128.min.js';script.async=true;
  script.onload=()=>finish(window.THREE&&String(window.THREE.REVISION)==='128'?null:new Error('three unavailable'));
  script.onerror=()=>finish(new Error('three unavailable'));document.head.appendChild(script);
 }).catch(error=>{loading=null;throw error;});return loading;
}
function create(THREE,host,options){
 let renderer=null,scene=null,envTarget=null,resizeObserver=null,observer=null,raf=0,disposed=false;
 let started=0,last=0,active=null,slow=0,low=!!options.low;
 const caption=options.caption,resources=new Set();let seed=110123;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const valid=()=>!disposed&&options.current();
 const setCaption=text=>{if(caption)caption.textContent=text;};
 function dispose(){
  if(disposed)return;disposed=true;
  if(raf)cancelAnimationFrame(raf);raf=0;
  if(resizeObserver)resizeObserver.disconnect();if(observer)observer.disconnect();
  window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);
  if(renderer)renderer.domElement.removeEventListener('webglcontextlost',lost);
  if(scene)scene.traverse(obj=>{if(obj.geometry)resources.add(obj.geometry);const list=Array.isArray(obj.material)?obj.material:[obj.material];for(const mat of list)if(mat){resources.add(mat);for(const key of Object.keys(mat))if(mat[key]&&mat[key].isTexture)resources.add(mat[key]);}});
  for(const resource of resources)resource.dispose();resources.clear();if(envTarget)envTarget.dispose();
  if(renderer){renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  host.classList.remove('alchemy-webgl-v110');
 }
 function fallback(){dispose();setCaption('静览丹炉 · 可照常炼制');}
 function lost(event){event.preventDefault();fallback();}
 function visibility(){if(document.hidden||!options.current())dispose();}
 let camera,alc,formation,fire,smoke,herbs,pill,pillHalo,firePositions,smokePositions;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:!low,powerPreference:'low-power'});
  renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.addEventListener('webglcontextlost',lost);
  renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.1,40);camera.position.set(0,3.5,8.6);camera.lookAt(0,2.0,0);
  function texture(w,h,paint){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);resources.add(t);return t;}
  const glow=texture(64,64,g=>{const grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'#fff');grad.addColorStop(.2,'rgba(255,255,255,.7)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,64,64);});
  function makeGlow(color,size,opacity){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,color,opacity,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));s.scale.set(size,size,1);return s;}
  const env=texture(128,64,g=>{const grad=g.createLinearGradient(0,0,0,64);for(const [at,color] of [[0,'#fff2c4'],[.3,'#6fbfa6'],[.55,'#1a5a52'],[.7,'#a8802f'],[1,'#10231f']])grad.addColorStop(at,color);g.fillStyle=grad;g.fillRect(0,0,128,64);});
  env.encoding=THREE.sRGBEncoding;env.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer);try{envTarget=pmrem.fromEquirectangular(env);scene.environment=envTarget.texture;}finally{pmrem.dispose();}
  scene.add(new THREE.HemisphereLight(0x9fe8d0,0x10231f,.6));
  const key=new THREE.DirectionalLight(0xffe2a8,1.5);key.position.set(3,6,6);scene.add(key);
  const rim=new THREE.DirectionalLight(0x57e0c0,1.1);rim.position.set(-5,3,-4);scene.add(rim);
  alc={scene,makeGlow,updaters:[]};

// Bronze-gold three-legged 丹炉: lathe body, legs, ears, lid and jade inner glow.
(function () {
  const ALC = alc;
  const group = new THREE.Group();
  const MOUTH_Y = 2.55;
  const JADE = 0x1fd6a0;

  function profile(pts, divisions) {
    const curve = new THREE.SplineCurve(pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); }));
    return curve.getPoints(divisions);
  }

  // Gilded bronze with verdigris speckle and a key-fret band (v runs bottom to top).
  function makeBronzeMap() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#e6c068');
    grad.addColorStop(0.5, '#c79a45');
    grad.addColorStop(1, '#7d5f2c');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 300; i++) {
      const x = random() * 512;
      const y = Math.pow(random(), 0.6) * 512;
      const r = 1 + random() * 7;
      g.fillStyle = 'rgba(40,130,110,' + (0.04 + random() * 0.16) + ')';
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }

    function band(y, h, color) {
      g.fillStyle = color;
      g.fillRect(0, y, 512, h);
    }
    const top = 150;
    band(top - 8, 4, '#ffe9a8');
    band(top, 44, '#154a44');
    band(top + 48, 4, '#ffe9a8');
    g.strokeStyle = '#f2cf78';
    g.lineWidth = 3;
    for (let x = 0; x < 512; x += 64) {
      g.beginPath();
      g.moveTo(x + 8, top + 36);
      g.lineTo(x + 8, top + 8);
      g.lineTo(x + 48, top + 8);
      g.lineTo(x + 48, top + 30);
      g.lineTo(x + 20, top + 30);
      g.lineTo(x + 20, top + 18);
      g.lineTo(x + 36, top + 18);
      g.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  }

  const bronze = new THREE.MeshStandardMaterial({ map: makeBronzeMap(), metalness: 0.92, roughness: 0.36, envMapIntensity: 0.75 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a93f, metalness: 1, roughness: 0.28, envMapIntensity: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c2a26, metalness: 0.4, roughness: 0.8, emissive: 0x0f6e55, emissiveIntensity: 0.6 });
  const gemMat = new THREE.MeshBasicMaterial({ color: 0x7ff5d0, toneMapped: false });

  // Body: outer wall rises to the flared rim, inner wall drops back down.
  const bodyPts = profile([[0.01, 0.62], [0.55, 0.66], [1.05, 0.95], [1.32, 1.4], [1.2, 1.9], [0.92, 2.2], [0.86, 2.36], [1.03, MOUTH_Y]], 24);
  group.add(new THREE.Mesh(new THREE.LatheGeometry(bodyPts, 40), bronze));
  const innerPts = profile([[1.03, MOUTH_Y], [0.84, 2.34], [0.7, 2.0], [0.01, 1.8]], 16);
  group.add(new THREE.Mesh(new THREE.LatheGeometry(innerPts, 24), dark));

  function goldRing(radius, tube, y) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 40), gold);
    m.rotation.x = Math.PI / 2;
    m.position.y = y;
    return m;
  }
  group.add(goldRing(1.03, 0.04, MOUTH_Y));
  group.add(goldRing(1.325, 0.022, 1.4));
  group.add(goldRing(0.87, 0.028, 2.3));

  // Three hoofed legs: one behind, two forward so all read from the front.
  const legPts = profile([[0.01, 0], [0.22, 0.01], [0.24, 0.08], [0.13, 0.24], [0.11, 0.42], [0.16, 0.62], [0.2, 0.85], [0.2, 1.15]], 24);
  const legGeo = new THREE.LatheGeometry(legPts, 20);
  [Math.PI, Math.PI / 3, -Math.PI / 3].forEach(function (a) {
    const leg = new THREE.Mesh(legGeo, gold);
    leg.position.set(Math.sin(a) * 0.82, 0, Math.cos(a) * 0.82);
    group.add(leg);
  });

  // Arched ears on the rim, tilted outward.
  const earGeo = new THREE.TorusGeometry(0.3, 0.055, 10, 24, Math.PI);
  [-1, 1].forEach(function (side) {
    const ear = new THREE.Mesh(earGeo, gold);
    ear.position.set(side * 1.08, MOUTH_Y - 0.08, 0);
    ear.rotation.z = -side * 0.3;
    group.add(ear);
  });

  // Jade cabochons around the shoulder.
  const GEMS = 12;
  const gems = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 10, 8), gemMat, GEMS);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < GEMS; i++) {
    const a = (i / GEMS) * Math.PI * 2;
    m4.makeTranslation(Math.sin(a) * 1.23, 1.82, Math.cos(a) * 1.23);
    gems.setMatrixAt(i, m4);
  }
  group.add(gems);

  // Furnace window: glowing jade disc with a gilded 丹 seal.
  function makeSealTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, '#d6fff0');
    grad.addColorStop(0.5, '#3fcfa2');
    grad.addColorStop(1, '#0a4f43');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#3a2606';
    g.font = 'bold 76px "STKaiti","KaiTi","Songti SC","Noto Serif CJK SC",serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('丹', 64, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  const seal = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 32),
    new THREE.MeshBasicMaterial({ map: makeSealTexture(), toneMapped: false })
  );
  seal.position.set(0, 1.32, 1.36);
  group.add(seal);
  const sealFrame = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 10, 40), gold);
  sealFrame.position.copy(seal.position);
  group.add(sealFrame);
  const sealGlow = ALC.makeGlow(JADE, 1.1, 0.4);
  sealGlow.position.set(0, 1.32, 1.45);
  group.add(sealGlow);

  // Lid pivots from its own group so other modules can lift it.
  const lid = new THREE.Group();
  const LID_Y = MOUTH_Y + 0.06;
  lid.position.y = LID_Y;
  const domePts = profile([[1.08, 0], [1.02, 0.1], [0.8, 0.38], [0.42, 0.62], [0.2, 0.72], [0.14, 0.84]], 32);
  const domeMat = bronze.clone();
  domeMat.side = THREE.DoubleSide;
  lid.add(new THREE.Mesh(new THREE.LatheGeometry(domePts, 40), domeMat));
  lid.add(goldRing(1.08, 0.038, 0));
  lid.add(goldRing(0.62, 0.02, 0.5));
  const knobPts = profile([[0.14, 0.82], [0.2, 0.9], [0.1, 0.98], [0.06, 1.04]], 16);
  lid.add(new THREE.Mesh(new THREE.LatheGeometry(knobPts, 24), gold));
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), gemMat);
  orb.position.y = 1.13;
  lid.add(orb);
  const orbGlow = ALC.makeGlow(JADE, 0.9, 0.7);
  orbGlow.position.y = 1.13;
  lid.add(orbGlow);
  group.add(lid);

  // Glow from the mouth; drawn over the rim so it bleeds like bloom.
  const innerGlow = ALC.makeGlow(JADE, 3.4, 0.7);
  innerGlow.position.y = MOUTH_Y + 0.05;
  innerGlow.material.depthTest = false;
  innerGlow.renderOrder = 5;
  group.add(innerGlow);
  const backHalo = ALC.makeGlow(0x2fbf9a, 6.0, 0.24);
  backHalo.position.set(0, 1.8, -1.6);
  group.add(backHalo);
  const innerLight = new THREE.PointLight(JADE, 1.4, 6, 2);
  innerLight.position.y = MOUTH_Y + 0.4;
  group.add(innerLight);

  // Public hooks for later modules.
  group.lid = lid;
  group.innerGlow = innerGlow;
  group.innerLight = innerLight;
  group.mouthY = MOUTH_Y;
  group.bellyRadius = 1.32;
  group.glowLevel = 0.5; // 0..1, set by fire/alchemy state
  group.lidOpen = 0; // 0..1, target for the lid lift

  let glow = group.glowLevel;
  let lidAmt = 0;

  ALC.scene.add(group);
  ALC.cauldron = group;

  ALC.updaters.push(function (dt, t) {
    glow += (group.glowLevel - glow) * Math.min(1, dt * 4);
    lidAmt += (group.lidOpen - lidAmt) * Math.min(1, dt * 5);

    const flicker = 0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1);
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.4);
    innerGlow.material.opacity = (0.2 + 0.5 * glow) * flicker;
    innerGlow.scale.setScalar((2.4 + 1.2 * glow) * (0.97 + 0.05 * breathe));
    innerLight.intensity = (0.6 + 2.2 * glow) * flicker;
    sealGlow.material.opacity = (0.15 + 0.35 * glow) * flicker;
    backHalo.material.opacity = 0.18 + 0.25 * glow;
    orbGlow.material.opacity = 0.45 + 0.35 * breathe;

    // Lid lifts and tips back; rattles faintly as the fire rises.
    const rattle = Math.max(0, glow - 0.6) * 0.03;
    lid.position.y = LID_Y + lidAmt * 1.15 + Math.abs(Math.sin(t * 19)) * rattle;
    lid.rotation.x = -lidAmt * 0.32;
    lid.rotation.z = Math.sin(t * 23) * rattle * 0.5;
  });
})();


  const stone=new THREE.MeshPhongMaterial({color:0x041412,flatShading:true});
  const altar=new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.5,.22,8),stone);altar.position.y=-.17;scene.add(altar);
  const glyph=texture(256,256,g=>{
   g.translate(128,128);g.strokeStyle='#d8ce84';g.fillStyle='#a0f5c8';g.lineWidth=2;
   for(const r of [67,78,110,120]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
   for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);for(let j=0;j<3;j++){const y=85+j*7;if((i>>j)&1)g.fillRect(-11,y,22,3);else{g.fillRect(-11,y,8,3);g.fillRect(3,y,8,3);}}g.restore();}
   g.beginPath();g.arc(0,0,42,-Math.PI/2,Math.PI/2);g.arc(0,21,21,Math.PI/2,Math.PI*1.5,true);g.arc(0,-21,21,Math.PI/2,Math.PI*1.5);g.stroke();
  });
  formation=new THREE.Mesh(new THREE.PlaneGeometry(4.9,4.9),new THREE.MeshBasicMaterial({map:glyph,transparent:true,opacity:.7,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));formation.rotation.x=-Math.PI/2;formation.position.y=.02;scene.add(formation);
  function particles(count,color,size){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));const mat=new THREE.PointsMaterial({map:glow,color,size,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);return points;}
  fire=particles(low?32:64,0xffb94c,.24);smoke=particles(low?28:48,0x88edca,.35);
  firePositions=fire.geometry.attributes.position;smokePositions=smoke.geometry.attributes.position;
  const leaf=texture(64,64,g=>{g.fillStyle='#fff';g.beginPath();g.ellipse(32,30,11,22,.5,0,Math.PI*2);g.fill();g.strokeStyle='#477e59';g.lineWidth=3;g.beginPath();g.moveTo(20,54);g.lineTo(42,10);g.stroke();});
  herbs=[];for(let i=0;i<5;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:leaf,color:[0x94e995,0xd3eeff,0xffae72,0xec83a7,0xc6a4ff][i],transparent:true,depthWrite:false}));sprite.scale.set(.4,.4,1);sprite.visible=false;scene.add(sprite);herbs.push(sprite);}
  pill=new THREE.Mesh(new THREE.SphereGeometry(.19,16,12),new THREE.MeshStandardMaterial({color:0xf8cf6c,metalness:.5,roughness:.28,emissive:0x574119}));pill.visible=false;scene.add(pill);
  pillHalo=makeGlow(0xffe5a6,1.3,0);scene.add(pillHalo);
  host.appendChild(renderer.domElement);host.classList.add('alchemy-webgl-v110');
  window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);}
  if(typeof MutationObserver==='function'){observer=new MutationObserver(visibility);observer.observe(host.closest('#alchemyPanel'),{attributes:true,attributeFilter:['class']});}
  resize();setCaption('炉火待启 · 选择丹方开炉');
 }catch(error){dispose();throw error;}
 function resize(){
  if(!valid())return;
  const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,low?1.25:1.5));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();draw();
 }
 function draw(){
  if(!valid())return;
  try{const t=performance.now();renderer.render(scene,camera);const cost=performance.now()-t;if(!low&&cost>24){if(++slow>=8){low=true;resize();}}}catch(_){fallback();}
 }
 function update(t,dt){
  const warming=t>.85&&t<2.65,opening=t>=2.65,success=active&&active.success>0;
  alc.cauldron.glowLevel=warming?.8:opening?.55:.22;
  alc.cauldron.lidOpen=t<.85||opening?1:0;
  for(const step of alc.updaters)step(dt,t);
  // Move the opened lid aside so it cannot hide the rising pill.
  alc.cauldron.lid.position.x=opening?Math.min(1,(t-2.65)/.45)*1.4:0;
  formation.rotation.z=t*.16;formation.material.opacity=warming?.95:.6;
  fire.material.opacity=warming?.9:opening?Math.max(0,1-(t-2.65)/1.2):.2;
  for(let i=0;i<firePositions.count;i++){const p=(i/firePositions.count+t*.5)%1,a=i*2.4+t*.6,r=1.35*(1-p);firePositions.setXYZ(i,Math.cos(a)*r,.1+p*.9,Math.sin(a)*r);}firePositions.needsUpdate=true;
  smoke.material.color.setHex(opening&&!success?0x8c9ca2:0x88edca);smoke.material.opacity=opening&&!success?.55:warming?.25:.12;
  for(let i=0;i<smokePositions.count;i++){const p=(i/smokePositions.count+t*.4)%1,a=i*2.4+t*1.4,r=.14+p*.5;smokePositions.setXYZ(i,Math.cos(a)*r,2.55+p*1.8,Math.sin(a)*r);}smokePositions.needsUpdate=true;
  for(let i=0;i<herbs.length;i++){const p=Math.max(0,Math.min(1,(t-i*.12)/.65));herbs[i].visible=t<1.2&&i<active.materials.length&&p<1;herbs[i].position.set((i%2?1:-1)*2.3*(1-p),2.65+(1-p)*.8+Math.sin(p*Math.PI)*.8,.5);herbs[i].material.rotation=t*3;}
  pill.visible=opening&&success;pill.position.set(0,2.8+Math.min(1,(t-2.65)/1.3)*1.25,.2);pill.rotation.y=t;
  pillHalo.position.copy(pill.position);pillHalo.material.opacity=pill.visible?.7:0;
  setCaption(t<1.2?'灵材入炉':warming?'地火温养':success?'丹成出炉':'炉火渐息');
 }
 function tick(now){
  raf=0;if(!valid()){dispose();return;}
  if(now-last<(low?1000/24:1000/30)){raf=requestAnimationFrame(tick);return;}
  const elapsed=(now-started)/1000,dt=Math.min(.1,(now-last)/1000);last=now;
  update(Math.min(4.8,elapsed),dt);draw();
  if(elapsed<4.8&&!disposed)raf=requestAnimationFrame(tick);
  else if(!disposed){fire.material.opacity=smoke.material.opacity=0;draw();setCaption(active.success?'丹成出炉 · 已收入行囊':'此次未能成丹 · 可重新炼制');}
 }
 function play(result){
  if(!valid())return;
  active=result;if(raf)cancelAnimationFrame(raf);
  started=performance.now();last=started-100;update(0,.1);draw();raf=requestAnimationFrame(tick);
 }
 return {play,dispose};
}
window.XiantuAlchemyStageV2868110={mount:async(host,options)=>{const THREE=await loadThree();return options.current()?create(THREE,host,options):null;}};
})();
