/* Optional alchemy presentation, adapted from the user's xiantu-alchemy-demo.html.
 * No recipe calculations, consumptions, reward rolls or save writes live here. */
(function(){
'use strict';
let loading=null;
// V28.68.119 alchemy show (audit A4): flying pills, 紫霄丹雷, bagua fire, herb smoke. All pools are allocated at mount.
const MAX_PILLS=10,TRAIL=8,BOLTS=3,BOLT_POINTS=33,BRANCH_POINTS=17,DURATION=5.2,BOLT_LIFE=.36,MOUTH_TOP=2.95;
const BOLT_OFFSETS=[[0,0],[.024,.01],[-.022,-.012],[.05,-.02],[-.05,.022]],BOLT_VERTS=BOLT_OFFSETS.length*(BOLT_POINTS-1+BRANCH_POINTS-1)*2;
const HERB_COLORS=[0x94e995,0xd3eeff,0xffae72,0xec83a7,0xc6a4ff];
const whole=v=>Number.isSafeInteger(v)&&v>0?v:0;
// What the stage shows for a committed result: one pill per pill made (up to MAX_PILLS),
// grey smoke when any furnace failed, and thunder on a full-success x10 or an alchemy level-up.
function planShow(r){
 if(!r)return {pills:0,total:0,smoke:0,thunder:false};
 const attempted=whole(r.attempted),success=Math.min(attempted,whole(r.success)),total=whole(r.pills===undefined?r.success:r.pills);
 return {pills:Math.min(MAX_PILLS,total),total,smoke:attempted>success?Math.max(.35,(attempted-success)/attempted):0,thunder:r.levelUp===true||(attempted===10&&success===10)};
}
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
  host.classList.remove('alchemy-webgl-v110');delete host.dataset.pillsShown;delete host.dataset.thunder;delete host.dataset.smoke;
 }
 function fallback(){dispose();setCaption('静览丹炉 · 可照常炼制');}
 function lost(event){event.preventDefault();fallback();}
 function visibility(){if(document.hidden||!options.current())dispose();}
 let camera,alc,formation,fire,smoke,herbs,pills,pillHalo,firePositions,smokePositions,trigrams,ringGlow,bellyGlow,herbTrail,trayGlow,puff,bolts,boltFlash,boltImpact,boltLight;
 const TRAY=new THREE.Vector3(2.35,.02,1.15);
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
  group.gold = gold;
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
  // V28.68.119: gilded bagua on jade, thicker strokes so it reads against the teal stage.
  function trigram(g,i,w){for(let j=0;j<3;j++){const y=85+j*7;if((i>>j)&1)g.fillRect(-11,y,22,w);else{g.fillRect(-11,y,8,w);g.fillRect(3,y,8,w);}}}
  const glyph=texture(256,256,g=>{
   g.translate(128,128);g.strokeStyle='#e2c577';g.fillStyle='#bfe9d2';g.lineWidth=2.6;
   for(const r of [67,78,110,120]){g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.stroke();}
   for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);trigram(g,i,3);g.restore();}
   g.beginPath();g.arc(0,0,42,-Math.PI/2,Math.PI/2);g.arc(0,21,21,Math.PI/2,Math.PI*1.5,true);g.arc(0,-21,21,Math.PI/2,Math.PI*1.5);g.stroke();
  });
  formation=new THREE.Mesh(new THREE.PlaneGeometry(4.9,4.9),new THREE.MeshBasicMaterial({map:glyph,transparent:true,opacity:.7,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));formation.rotation.x=-Math.PI/2;formation.position.y=.02;scene.add(formation);
  // Lit trigrams share one texture; each 45-degree sector shows only its own trigram (CircleGeometry UVs match the plane).
  const litGlyph=texture(256,256,g=>{g.translate(128,128);g.fillStyle='#fff1c0';g.shadowColor='#ffc960';g.shadowBlur=9;for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);trigram(g,i,4);trigram(g,i,4);g.restore();}});
  trigrams=[];
  for(let i=0;i<8;i++){
   const phi=-Math.PI/2-i*Math.PI/4;
   const sector=new THREE.Mesh(new THREE.CircleGeometry(2.45,3,phi-Math.PI/8,Math.PI/4),new THREE.MeshBasicMaterial({map:litGlyph,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,side:THREE.DoubleSide}));
   sector.position.z=.01;formation.add(sector);trigrams.push(sector);
  }
  ringGlow=new THREE.Mesh(new THREE.RingGeometry(2.08,2.34,64),new THREE.MeshBasicMaterial({color:0xf0cf7a,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,side:THREE.DoubleSide}));
  ringGlow.position.z=.012;formation.add(ringGlow);
  function particles(count,color,size,extra){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));if(extra&&extra.vertexColors)geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(count*3),3));const mat=new THREE.PointsMaterial(Object.assign({map:glow,color,size,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false},extra||{}));const points=new THREE.Points(geo,mat);points.frustumCulled=false;scene.add(points);return points;}
  // Warmer, larger fire under the belly, with a glow that swells while 地火温养.
  fire=particles(low?32:64,0xffa13d,low?.36:.42);smoke=particles(low?28:48,0x88edca,.35);
  firePositions=fire.geometry.attributes.position;smokePositions=smoke.geometry.attributes.position;
  bellyGlow=makeGlow(0xff8a36,3.4,0);bellyGlow.position.set(0,.55,.4);scene.add(bellyGlow);
  const leaf=texture(64,64,g=>{g.fillStyle='#fff';g.beginPath();g.ellipse(32,30,11,22,.5,0,Math.PI*2);g.fill();g.strokeStyle='#477e59';g.lineWidth=3;g.beginPath();g.moveTo(20,54);g.lineTo(42,10);g.stroke();});
  herbs=[];for(let i=0;i<HERB_COLORS.length;i++){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:leaf,color:HERB_COLORS[i],transparent:true,depthWrite:false}));sprite.scale.set(.4,.4,1);sprite.visible=false;scene.add(sprite);herbs.push(sprite);}
  // Coloured smoke trails: TRAIL points behind each herb, faded through vertex colour (additive).
  herbTrail=particles(HERB_COLORS.length*TRAIL,0xffffff,.42,{vertexColors:true});herbTrail.material.opacity=.9;
  // Vertex-colour fades must not raise canvas alpha, or faded points show as dark dots over the CSS backdrop.
  Object.assign(herbTrail.material,{blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.ZeroFactor,blendDstAlpha:THREE.OneFactor});
  // Flying pills: a fixed pool of MAX_PILLS instances plus one halo point each.
  const tray=new THREE.Group();tray.position.copy(TRAY);
  tray.add(new THREE.Mesh(new THREE.CylinderGeometry(.62,.46,.12,28),new THREE.MeshStandardMaterial({color:0x1f6b56,metalness:.3,roughness:.4,emissive:0x0b3a2e,emissiveIntensity:.6})));
  const trayRim=new THREE.Mesh(new THREE.TorusGeometry(.62,.035,8,36),alc.cauldron.gold);trayRim.rotation.x=Math.PI/2;trayRim.position.y=.06;tray.add(trayRim);
  scene.add(tray);
  pills=new THREE.InstancedMesh(new THREE.SphereGeometry(.14,14,10),new THREE.MeshStandardMaterial({color:0xe8b043,metalness:.6,roughness:.3,emissive:0x5a3a0c}),MAX_PILLS);
  pills.count=0;pills.frustumCulled=false;scene.add(pills);
  pillHalo=particles(MAX_PILLS,0xffc65c,.5);pillHalo.geometry.setDrawRange(0,0);
  trayGlow=makeGlow(0xffd27a,1.8,0);trayGlow.position.set(TRAY.x,TRAY.y+.25,TRAY.z);scene.add(trayGlow);
  // Failed furnaces: a grey smoke puff (normal blending so it dims rather than glows).
  puff=particles(low?18:30,0xa3abae,.9,{blending:THREE.NormalBlending});
  // 紫霄丹雷: BOLTS pooled line sets, rebuilt by midpoint displacement while they strike.
  bolts=[];
  for(let b=0;b<BOLTS;b++){
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(BOLT_VERTS*3),3));
   // White-violet core, purple outer copies (written once; only positions change per strike).
   const col=new Float32Array(BOLT_VERTS*3),per=BOLT_VERTS/BOLT_OFFSETS.length;
   for(let v=0;v<BOLT_VERTS;v++){const outer=v>=per*3;col[v*3]=outer?.62:.96;col[v*3+1]=outer?.42:.9;col[v*3+2]=1;}
   geo.setAttribute('color',new THREE.BufferAttribute(col,3));
   const line=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));
   line.frustumCulled=false;line.renderOrder=8;line.visible=false;scene.add(line);bolts.push(line);
  }
  boltFlash=makeGlow(0xb48ce6,9,0);boltFlash.position.set(0,3.2,-1.2);boltFlash.material.depthTest=false;boltFlash.renderOrder=7;scene.add(boltFlash);
  boltImpact=makeGlow(0xf3e6ff,2.4,0);boltImpact.position.set(0,MOUTH_TOP,0.2);boltImpact.material.depthTest=false;boltImpact.renderOrder=9;scene.add(boltImpact);
  boltLight=new THREE.PointLight(0xc9a2ff,0,10,2);boltLight.position.set(0,4.2,1.2);scene.add(boltLight);
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
 const v0=new THREE.Vector3(),v1=new THREE.Vector3(),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1);
 const boltPts=new Float32Array(BOLT_POINTS*3),branchPts=new Float32Array(BRANCH_POINTS*3);
 // Midpoint displacement: split every segment, push the midpoint sideways, halve the push each level.
 function displace(out,n,ax,ay,az,bx,by,bz,amount){
  const last=n-1;out[0]=ax;out[1]=ay;out[2]=az;out[last*3]=bx;out[last*3+1]=by;out[last*3+2]=bz;
  for(let step=last;step>1;step>>=1){
   const half=step>>1;
   for(let i=half;i<last;i+=step){const a=(i-half)*3,b=(i+half)*3,o=i*3;out[o]=(out[a]+out[b])/2+(random()-.5)*amount;out[o+1]=(out[a+1]+out[b+1])/2+(random()-.5)*amount*.35;out[o+2]=(out[a+2]+out[b+2])/2+(random()-.5)*amount*.6;}
   amount*=.55;
  }
 }
 function buildBolt(line,index){
  const sx=(index-1)*2.1+(random()-.5)*1.2,tx=(random()-.5)*.5,lidX=alc.cauldron.lid.position.x;
  displace(boltPts,BOLT_POINTS,sx,7.2,-.6,tx+lidX*.3,MOUTH_TOP,.15,1.5);
  const k=(8+Math.floor(random()*12))*3;
  displace(branchPts,BRANCH_POINTS,boltPts[k],boltPts[k+1],boltPts[k+2],boltPts[k]+(random()<.5?-1:1)*(.8+random()*.8),boltPts[k+1]-1.2-random(),boltPts[k+2]+.3,.7);
  const pos=line.geometry.attributes.position,arr=pos.array;let w=0;
  // Three slightly offset copies thicken the 1px WebGL line into a visible core.
  for(const [ox,oy] of BOLT_OFFSETS){
   for(let i=0;i<BOLT_POINTS-1;i++){const a=i*3;arr[w++]=boltPts[a]+ox;arr[w++]=boltPts[a+1]+oy;arr[w++]=boltPts[a+2];arr[w++]=boltPts[a+3]+ox;arr[w++]=boltPts[a+4]+oy;arr[w++]=boltPts[a+5];}
   for(let i=0;i<BRANCH_POINTS-1;i++){const a=i*3;arr[w++]=branchPts[a]+ox;arr[w++]=branchPts[a+1]+oy;arr[w++]=branchPts[a+2];arr[w++]=branchPts[a+3]+ox;arr[w++]=branchPts[a+4]+oy;arr[w++]=branchPts[a+5];}
  }
  pos.needsUpdate=true;
 }
 function herbAt(i,p,out){return out.set((i%2?1:-1)*2.3*(1-p),2.65+(1-p)*.8+Math.sin(p*Math.PI)*.8,.5);}
 function pillAt(i,p,out){
  // Quadratic Bezier from the mouth, over a fanned apex, into slot i of the tray.
  const a=i*2.4,r=.08+.36*Math.sqrt(i/MAX_PILLS),ex=TRAY.x+Math.cos(a)*r,ey=TRAY.y+.13+(i>=7?.1:0),ez=TRAY.z+Math.sin(a)*r*.7;
  const sx=0,sy=MOUTH_TOP+.2,sz=.1,cx=.6+(i%5)*.32-.4,cy=5.1-(i%3)*.25,cz=.6,u=1-p;
  return out.set(u*u*sx+2*u*p*cx+p*p*ex,u*u*sy+2*u*p*cy+p*p*ey,u*u*sz+2*u*p*cz+p*p*ez);
 }
 const ease=p=>p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
 function update(t,dt){
  const warming=t>.85&&t<2.65,opening=t>=2.65,show=active?planShow(active):{pills:0,smoke:0,thunder:false},success=show.pills>0;
  alc.cauldron.glowLevel=warming?.8:opening?.55:.22;
  alc.cauldron.lidOpen=t<.85||opening?1:0;
  for(const step of alc.updaters)step(dt,t);
  // Move the opened lid aside so it cannot hide the flying pills.
  alc.cauldron.lid.position.x=opening?Math.min(1,(t-2.65)/.45)*1.4:0;
  formation.rotation.z=t*.16;formation.material.opacity=warming?.95:.7;
  // Bagua fire: the eight trigrams light in sequence and the outer ring brightens.
  for(let i=0;i<trigrams.length;i++){const on=Math.max(0,Math.min(1,(t-.85-i*.2)/.18));trigrams[i].material.opacity=warming?on:opening?Math.max(0,1-(t-2.65)/1.4)*.8:0;}
  ringGlow.material.opacity=warming?Math.min(.75,(t-.85)/1.6*.75):opening?Math.max(0,.75-(t-2.65)*.5):0;
  fire.material.opacity=warming?.95:opening?Math.max(0,1-(t-2.65)/1.2):.25;
  bellyGlow.material.opacity=(warming?.7:opening?Math.max(0,.7-(t-2.65)*.45):.18)*(0.9+0.1*Math.sin(t*9));
  for(let i=0;i<firePositions.count;i++){const p=(i/firePositions.count+t*.5)%1,a=i*2.4+t*.6,r=1.35*(1-p);firePositions.setXYZ(i,Math.cos(a)*r,.1+p*.9,Math.sin(a)*r);}firePositions.needsUpdate=true;
  smoke.material.color.setHex(opening&&!success?0x8c9ca2:0x88edca);smoke.material.opacity=opening&&!success?.55:warming?.25:.12;
  for(let i=0;i<smokePositions.count;i++){const p=(i/smokePositions.count+t*.4)%1,a=i*2.4+t*1.4,r=.14+p*.5;smokePositions.setXYZ(i,Math.cos(a)*r,2.55+p*1.8,Math.sin(a)*r);}smokePositions.needsUpdate=true;
  // Herbs and their coloured smoke trails.
  const herbCount=active?Math.min(herbs.length,active.materials.length):0,trailPos=herbTrail.geometry.attributes.position,trailCol=herbTrail.geometry.attributes.color;
  for(let i=0;i<herbs.length;i++){
   const p=Math.max(0,Math.min(1,(t-i*.12)/.65)),on=t<1.4&&i<herbCount&&p<1;
   herbs[i].visible=on&&t<1.2;herbAt(i,p,herbs[i].position);herbs[i].material.rotation=t*3;
   const c=HERB_COLORS[i];
   for(let k=0;k<TRAIL;k++){const j=i*TRAIL+k,pk=Math.max(0,p-(k+1)*.045),fade=on&&p>0?(1-k/TRAIL)*(t<1.2?1:Math.max(0,(1.4-t)/.2)):0;herbAt(i,pk,v0);trailPos.setXYZ(j,v0.x,v0.y+k*.02,v0.z);trailCol.setXYZ(j,((c>>16)&255)/255*fade,((c>>8)&255)/255*fade,(c&255)/255*fade);}
  }
  trailPos.needsUpdate=trailCol.needsUpdate=true;
  // One pill per pill actually made (pool of MAX_PILLS), staggered out of the mouth.
  let shown=0,landed=0;const haloPos=pillHalo.geometry.attributes.position;
  for(let i=0;i<show.pills;i++){
   const start=2.85+i*.1;if(t<start)continue;
   const p=Math.min(1,(t-start)/.85);pillAt(i,ease(p),v1);if(p>=1)landed++;
   q.setFromAxisAngle(v0.set(0,1,0),t*3+i);m4.compose(v1,q,one);pills.setMatrixAt(shown,m4);haloPos.setXYZ(shown,v1.x,v1.y,v1.z);shown++;
  }
  pills.count=shown;pills.instanceMatrix.needsUpdate=true;haloPos.needsUpdate=true;pillHalo.geometry.setDrawRange(0,shown);
  pillHalo.material.opacity=shown?.55:0;trayGlow.material.opacity=landed?.35+.35*landed/MAX_PILLS:0;
  // Grey smoke for failed furnaces, scaled by the failed share.
  const pt=t-2.75,pp=puff.geometry.attributes.position;
  puff.material.opacity=show.smoke&&pt>0?show.smoke*Math.max(0,1-pt/1.6)*.85:0;
  for(let i=0;i<pp.count;i++){const a=i*2.39996,s=.5+((i*37)%11)/11,age=Math.max(0,pt);pp.setXYZ(i,Math.cos(a)*s*age*.9,MOUTH_TOP+.15+age*(.9+s*.5),.2+Math.sin(a)*s*age*.6);}pp.needsUpdate=true;
  puff.material.size=.7+Math.max(0,pt)*.9;
  // 紫霄丹雷: bolts strike the lid as it opens.
  let strike=0;
  for(let b=0;b<bolts.length;b++){
   const at=2.58+b*.3,age=t-at,on=show.thunder&&age>=0&&age<BOLT_LIFE;
   bolts[b].visible=on;
   if(on){if(!bolts[b].userData.built||age>bolts[b].userData.built+.07){buildBolt(bolts[b],b);bolts[b].userData.built=age;}const f=(1-.6*age/BOLT_LIFE)*(.7+.3*Math.sin(age*90));bolts[b].material.opacity=f;strike=Math.max(strike,f);}
   else bolts[b].userData.built=0;
  }
  boltFlash.material.opacity=strike*.8;boltImpact.material.opacity=strike*.9;boltLight.intensity=strike*5;
  setCaption(t<1.2?'灵材入炉':warming?'八卦地火 · 温养':show.thunder&&t<3.6?'紫霄丹雷 · 丹成':success?'丹成出炉':'炉火渐息');
  return shown;
 }
 function tick(now){
  raf=0;if(!valid()){dispose();return;}
  if(now-last<(low?1000/24:1000/30)){raf=requestAnimationFrame(tick);return;}
  const elapsed=(now-started)/1000,dt=Math.min(.1,(now-last)/1000);last=now;
  update(Math.min(DURATION,elapsed),dt);draw();
  if(elapsed<DURATION&&!disposed)raf=requestAnimationFrame(tick);
  else if(!disposed){fire.material.opacity=smoke.material.opacity=puff.material.opacity=0;draw();const n=planShow(active).total;setCaption(n?`丹成出炉 · ${n} 枚已收入行囊`:'此次未能成丹 · 可重新炼制');}
 }
 function play(result){
  if(!valid())return;
  active=result;if(raf)cancelAnimationFrame(raf);
  const show=planShow(result);host.dataset.pillsShown=String(show.pills);host.dataset.thunder=String(show.thunder);host.dataset.smoke=show.smoke?'1':'0';
  started=performance.now();last=started-100;update(0,.1);draw();raf=requestAnimationFrame(tick);
 }
 return {play,dispose};
}
window.XiantuAlchemyStageV2868110={planShow,maxPills:MAX_PILLS,mount:async(host,options)=>{const THREE=await loadThree();return options.current()?create(THREE,host,options):null;}};
})();
