'use strict';
// V28.68.122 gold line glyphs (audit A8): every equipment slot key and the three exploration types resolve to a
// single-colour line glyph (inline SVG in the DOM, Path2D on the map canvas) instead of emoji; legacy icon fields
// stay for save/old-caller compatibility, the map draw is static (no time dependence) and falls back to emoji without Path2D.
const fs=require('fs'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||require('path').resolve(__dirname,'..'),f=require('./v2858-dom-fixture.cjs')(root);
const run=s=>f.run(s);
run("document.documentElement.classList.add('xiantu-v2762-ready')");
for(const n of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(n);
const EMOJI=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
run("resetRuntimeState();player=createDefaultPlayer();player.name='临时测试';player.tutorial.skipped=true;gameState='exploring';closeWorldOverlay()");

// --- Glyph table: path grammar, every slot key and exploration type mapped ---
const glyphs=JSON.parse(run('JSON.stringify(XT_GLYPHS_V2868122)'));
for(const [k,d] of Object.entries(glyphs))a.match(d,/^M[\d\s.,MmLlHhVvCcSsQqAaZz-]+$/,k+' is plain SVG path data');
const slots=JSON.parse(run('JSON.stringify(Object.keys(EQUIPMENT_SLOTS))'));
a.equal(slots.length,18);
const kinds=new Set(slots.map(s=>run(`xtGlyphKeyV2868122('${s}')`)));
a.ok(!kinds.has(null)&&[...kinds].every(k=>glyphs[k]),'every slot key has a glyph');
a.ok(kinds.size>=11,'at least eleven distinct slot glyphs, got '+kinds.size);
a.deepEqual(JSON.parse(run('JSON.stringify(XT_EXPLORE_GLYPH_V2868122)')),['herb','satchel','stele']);
for(const s of slots){const h=run(`equipSlotIconV2868122('${s}')`);a.match(h,/^<svg class="xt-glyph" data-glyph="\w+" viewBox="0 0 24 24"[^>]*stroke="currentColor"[^>]*aria-hidden="true"/);a.doesNotMatch(h,EMOJI,s);}
a.match(run("equipSlotIconV2868122('lifeArtifact',true)"),/data-glyph="lock"/);
a.equal(run("equipSlotIconV2868122('nonexistent')"),'•','unknown slot keeps a text fallback');
for(const s of slots)a.ok(run(`typeof EQUIPMENT_SLOTS['${s}'].icon==='string'&&EQUIPMENT_SLOTS['${s}'].icon.length>0`),s+' legacy icon field kept');
console.log('PASS glyph table: 18 slot keys ->',kinds.size,'glyphs, 3 exploration glyphs, legacy icon fields kept');

// --- Equipment panel rows render glyphs, not emoji; empty/locked state classes; no save keys added ---
run('updateStats();ensureEquipmentManagerState()');const keysBefore=run('JSON.stringify(Object.keys(player).sort())');
run("player.level=1;player.equipment.weapon=Object.keys(EQUIPMENT_DB).find(n=>getEquipData(n)?.slot==='weapon')||null");
const rows=run('renderEquipSlots(Object.keys(EQUIPMENT_SLOTS))');
a.equal((rows.match(/class="xt-glyph"/g)||[]).length,18,'one glyph per slot row');
const iconSpans=rows.match(/<span class="xt-cell-icon[^"]*"[^>]*>[\s\S]*?<\/svg><\/span>/g)||[];
a.equal(iconSpans.length,18);for(const sp of iconSpans)a.doesNotMatch(sp,EMOJI);
a.ok(/xt-slot-glyph-v2868122[\w\s-]*is-locked" aria-hidden="true"><svg class="xt-glyph" data-glyph="lock"/.test(rows),'life artifact locked below level 3');
a.ok(/xt-slot-glyph-v2868122 is-empty /.test(rows)&&/xt-slot-glyph-v2868122  " aria-hidden="true"><svg class="xt-glyph" data-glyph="weapon"/.test(rows),'empty and equipped slots marked');
run('updateStats()');
a.doesNotMatch(String(run("document.getElementById('panelEquipmentFull')?.innerHTML||''")).split('查看全部')[0],/[\u{1F451}\u{1F458}\u{2694}]/u,'HUD equipment chips use glyphs');
{const after=JSON.parse(run('JSON.stringify(Object.keys(player).sort())')),before=JSON.parse(keysBefore);a.deepEqual(after.filter(k=>!before.includes(k)),[],'no save field added');}
console.log('PASS equipment rows: 18 glyph icons, locked/empty states, no save keys added');

// --- Map exploration marker: Path2D glyph stroke, check when claimed, static, emoji fallback without Path2D ---
run(`globalThis.__calls=[];globalThis.Path2D=class{constructor(d){this.d=d}};
globalThis.__ctx=new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];return (...args)=>{__calls.push([k,args.map(x=>x&&x.d?{path:x.d}:x)]);};},set(o,k,v){o[k]=v;__calls.push(['set:'+String(k),[v]]);return true;}});
globalThis.__pois=buildExplorationPoisV2828('south',[]);`);
const draw=(type,{claimed=false}={})=>JSON.parse(run(`__calls=[];(()=>{const o=__pois.find(p=>p.exploreTypeV2828===${type});const m=explorationV2828('south');m.claimed={};${claimed?'m.claimed[o.id]=1;':''}currentRegion='south';drawExplorationPresenceV286889(__ctx,o);})();JSON.stringify(__calls)`));
for(const [type,key] of [[0,'herb'],[1,'satchel'],[2,'stele']]){
  const calls=draw(type),stroke=calls.find(c=>c[0]==='stroke'&&c[1][0]?.path);
  a.ok(stroke,key+' stroked via Path2D');a.equal(stroke[1][0].path,glyphs[key]);
  a.ok(!calls.some(c=>c[0]==='fillText'),key+': no emoji text drawn');
  a.ok(calls.some(c=>c[0]==='set:strokeStyle'&&c[1][0]==='#f0dca0'),key+' glyph in gold-300');
}
a.equal(draw(1,{claimed:true}).find(c=>c[0]==='stroke'&&c[1][0]?.path)[1][0].path,glyphs.check,'claimed point shows check glyph');
for(const q of ['off','low','high']){
  run(`mapAliveQualityV2893=()=>'${q}';mapAliveCalmV2893=()=>true`);
  const one=JSON.stringify(draw(1)),two=(run('performance.now=()=>123456'),JSON.stringify(draw(1)));
  a.equal(one,two,`effects ${q} / reduced motion: marker identical across frames`);
  a.ok(JSON.parse(one).some(c=>c[0]==='stroke'&&c[1][0]?.path===glyphs.satchel),`glyph shown with effects ${q}`);
}
run('delete globalThis.Path2D');
const fb=draw(1);a.ok(fb.some(c=>c[0]==='fillText'&&c[1][0]===run('__pois.find(p=>p.exploreTypeV2828===1).icon')),'no Path2D: emoji fallback');
a.equal(run('drawXtGlyphV2868122(__ctx,"herb",0,0,20)'),false);
console.log('PASS map marker: Path2D glyph per type, check when claimed, static under effects off/reduced motion, emoji fallback');

// --- Scroll map pin, exploration dialog and manual use the glyph ---
const pin=run("scrollPoiArtV2832(__pois.find(p=>p.exploreTypeV2828===2))");
a.match(pin,/^<i class="xt-scroll-glyph-v2868122"><svg class="xt-glyph" data-glyph="stele"/);
a.match(run("exploreIconV2868122(__pois[0])"),/data-glyph="herb"/);
a.equal(run("exploreIconV2868122({icon:'◎'})"),'◎','non-exploration poi keeps its icon');
const src=fs.readFileSync(root+'/xiantu-v2762-core.js','utf8');
a.match(src,/<h3><span class="xt-inline-glyph-v2868122">\$\{exploreIconV2868122\(p\)\}<\/span>/);
a.match(src,/<strong><span class="xt-inline-glyph-v2868122">\$\{exploreIconV2868122\(p\)\}<\/span>/);
const css=fs.readFileSync(root+'/xiantu-v2762.css','utf8').split('V28.68.122 (audit A8)')[1]||'';
a.ok(css.includes('var(--xt-gold-300')&&css.includes('var(--xt-ink-800'),'jade-gold tokens');
a.doesNotMatch(css.replace(/\/\*[\s\S]*?\*\//g,''),/animation\s*:|transition\s*:/,'glyph styles are static');
a.equal(f.errors.length,0,JSON.stringify(f.errors.slice(0,2)));
console.log('PASS scroll pin, dialog and manual use glyphs; CSS static and tokenised');
