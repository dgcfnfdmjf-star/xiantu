// V28.47: realm-gated spell choreography, driven solely by the existing map clock.
// These formations depict the campaign. Damage, casualties and rewards remain combat-owned.
const WAR_SPELL_PHASES_V2841=[
 {duration:1.7,name:'结印蓄灵'}, {duration:1.8,name:'飞剑破障'}, {duration:1.2,name:'双阵相抗'},
 {duration:1.8,name:'魔焰压境'}, {duration:1.8,name:'仙法反制'}, {duration:1.5,name:'护阵回稳'}
];
function warSpellProfileV2841(record){
 const level=warIntV2839(record.realm??player.level,0,16);
 return {level,flying:level>=2,dharma:level>=5,thunder:level>=9,immortal:level>=10,
  label:level>=10?'仙域法相':level>=9?'雷法撼界':level>=5?'法相镇阵':level>=4?'剑阵凌空':level>=2?'御剑斗法':level===1?'引气护阵':'凡人守备'};
}
function warSpellStateV2841(scene){
 if(!scene.spellsV2841)scene.spellsV2841={profile:warSpellProfileV2841(scene.record),phase:0,progress:0,active:false,shattered:0};
 return scene.spellsV2841;
}
function updateWarSpellStateV2841(scene){
 const fx=warSpellStateV2841(scene),state=WAR_MAP_V2840;
 fx.active=scene.kind==='battle'&&!state.reduced;
 let t=fx.active?state.clock%9.8:0;fx.phase=0;
 for(let i=0;i<WAR_SPELL_PHASES_V2841.length;i++){if(t<WAR_SPELL_PHASES_V2841[i].duration){fx.phase=i;break;}t-=WAR_SPELL_PHASES_V2841[i].duration;}
 fx.progress=t/WAR_SPELL_PHASES_V2841[fx.phase].duration;
 const result=scene.record.records?.find(r=>r.stage===2);
 fx.shattered=scene.kind==='victory'&&result?.won?1:0;
 return fx;
}
function warSpellCaptionV2841(scene,fx){
 if(scene.kind==='incoming')return '双方守阵 · 等待迎敌';
 if(scene.kind==='victory')return fx.shattered?'阵眼已破 · 等待结算':'斗法暂歇 · 等待结算';
 if(WAR_MAP_V2840.reduced)return fx.profile.label+' · 静态阵势';
 if(fx.profile.level===0)return ['守护阵旗','前线接敌','符障承压','敌阵逼近','守阵接应','阵前整备'][fx.phase];
 if(fx.phase===1&&!fx.profile.flying)return '灵符破障';
 if(fx.phase===4)return fx.profile.thunder?'雷法落阵':fx.profile.dharma?'法相镇魔':'剑气反制';
 return WAR_SPELL_PHASES_V2841[fx.phase].name;
}
const warBarBeforeV2841=updateWarMapBarV2840;
updateWarMapBarV2840=function(scene){
 warBarBeforeV2841(scene);const bar=document.getElementById('warMapBarV2840');if(!bar)return;
 let chant=bar.querySelector('.war-map-chant-v2841');if(!chant){chant=document.createElement('span');chant.className='war-map-chant-v2841';bar.querySelector('div')?.appendChild(chant);}
 const text=warSpellCaptionV2841(scene,updateWarSpellStateV2841(scene));if(chant.textContent!==text)chant.textContent=text;
};
appendWarUnitsV2840=function(items,dt,view){
 const state=WAR_MAP_V2840,s=state.scene;if(!s||!warSceneVisibleV2840(s,view))return;
 if(!state.reduced)state.clock+=Math.max(0,Math.min(.05,dt));
 const fx=updateWarSpellStateV2841(s),t=state.reduced?0:state.clock;
 for(const u of s.units){
  const side=u.side?1:-1,v=(u.row/Math.max(1,s.rows-1)-.5)*2;
  u.roleV2841=u.rank===0?'ward':fx.profile.flying?'adept':'caster';
  // Ground disciples keep the ward; adepts trace a small hovering arc, never a marching charge.
  const airborne=u.roleV2841==='adept',drift=fx.active&&airborne?Math.sin(t*.6+u.phase)*5:0;
  u.x=s.site.x+side*(u.rank===0?68+Math.cos(v*1.25)*16:117+Math.cos(v*1.25)*8)+drift;
  const withdrawing=s.kind==='victory'&&(fx.shattered?u.side===1:true),withdraw=withdrawing?(state.reduced?1:Math.min(1,t/4)):0;
  u.x+=side*withdraw*26;u.y=s.site.y+v*69+u.rank*6+withdraw*12;u.fadeV2841=1-withdraw*.65;
  u.liftV2841=airborne?22+(fx.active?Math.sin(t*.9+u.phase)*3:0):0;
  u.frame=0;u.attack=false;u.channelV2841=fx.active&&(u.side?fx.phase===3:fx.phase===0||fx.phase===4);
  if(u.x>=view.minX&&u.x<=view.maxX&&u.y>=view.minY&&u.y<=view.maxY)items.push(u);
 }
};
function warRuneV2841(ctx,x,y,rx,ry,side,t,strength=1){
 const color=side?'#b66a83':'#70afab';ctx.save();ctx.translate(x,y);ctx.globalAlpha*=strength;ctx.strokeStyle=color;ctx.lineWidth=1.2;
 ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(0,0,rx*.77,ry*.77,0,0,Math.PI*2);ctx.stroke();
 const count=PERF_CONFIG.ultraSmooth?6:10;
 for(let i=0;i<count;i++){const a=i*Math.PI*2/count+t*.08,c=Math.cos(a),s=Math.sin(a);ctx.beginPath();ctx.moveTo(c*rx*.81,s*ry*.81);ctx.lineTo(c*rx*.97,s*ry*.97);ctx.stroke();}
 ctx.fillStyle=side?'#84496318':'#70ad9b18';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function warSwordV2841(ctx,x,y,angle,length,side,alpha=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha*=alpha;
 ctx.fillStyle=side?'#bd7b97':'#e6f1db';ctx.strokeStyle=side?'#e1aec9':'#62a5a8';ctx.lineWidth=.9;
 ctx.beginPath();ctx.moveTo(length*.65,0);ctx.lineTo(length*.10,-3);ctx.lineTo(-length*.35,-2);ctx.lineTo(-length*.35,2);ctx.lineTo(length*.10,3);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='#c5a76e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-length*.35,-5);ctx.lineTo(-length*.35,5);ctx.moveTo(-length*.35,0);ctx.lineTo(-length*.53,0);ctx.stroke();ctx.restore();
}
function warFigureV2841(ctx,side,height,adept=false){
 const im=SCROLL_ART_V2831.enemies,hero=PAINTED_ACTOR_V2838;
 if(adept&&!side&&hero.ready){const b=PAINTED_ACTOR_ROWS_V2838[1],scale=height/256;ctx.drawImage(hero.image,0,b.y,192,b.h,-192*scale/2,-b.feet[0]*scale,192*scale,b.h*scale);return;}
 if(typeof drawScrollWarFigureV2853==='function'&&drawScrollWarFigureV2853(ctx,side,height))return;
 if(im){const cell=side?5:6,cw=im.width/4,ch=im.height/2,w=height*cw/ch;ctx.drawImage(im,cell%4*cw,Math.floor(cell/4)*ch,cw,ch,-w/2,5-height,w,height);return;}
 // Asset failure keeps a small robed silhouette and visible formation rather than blocking play.
 ctx.fillStyle=side?'#694051':'#c5d4be';ctx.strokeStyle=side?'#be8195':'#557d7c';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(0,-height*.72);ctx.quadraticCurveTo(-height*.17,-height*.45,-height*.23,0);ctx.lineTo(height*.23,0);ctx.quadraticCurveTo(height*.17,-height*.45,0,-height*.72);ctx.fill();ctx.stroke();
 ctx.fillStyle='#dac6a6';ctx.beginPath();ctx.arc(0,-height*.83,height*.08,0,Math.PI*2);ctx.fill();
}
drawWarUnitV2840=function(ctx,u){
 const s=WAR_MAP_V2840.scene;if(!s)return;const fx=warSpellStateV2841(s),t=WAR_MAP_V2840.reduced?0:WAR_MAP_V2840.clock,lift=u.liftV2841||0;
 ctx.save();ctx.globalAlpha=u.fadeV2841??1;ctx.translate(u.x,u.y);ctx.fillStyle=u.side?'#512c3f2e':'#304d402e';ctx.beginPath();ctx.ellipse(0,3,lift?9:12,3,0,0,Math.PI*2);ctx.fill();
 ctx.translate(0,-lift);const dir=u.side?-1:1;
 if(lift){if(u.side)warRuneV2841(ctx,0,1,22,6,1,t,.8);else warSwordV2841(ctx,0,1,-.08,47,0,.94);}
 else warRuneV2841(ctx,0,2,13,4,u.side,0,.5);
 ctx.scale(dir,1);warFigureV2841(ctx,u.side,u.rank?51:45,u.rank===1);
 if(u.channelV2841&&fx.profile.level>0){ctx.strokeStyle=u.side?'#e2a0aeaa':'#c8e9c4bb';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(12,-24,7+Math.sin(t+u.phase),0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(8,-24);ctx.lineTo(16,-24);ctx.moveTo(12,-28);ctx.lineTo(12,-20);ctx.stroke();}
 ctx.restore();
};
function warDharmaV2841(ctx,s,fx,side){
 if(!fx.profile.dharma)return;
 const t=WAR_MAP_V2840.reduced?0:WAR_MAP_V2840.clock,x=s.site.x+(side?104:-104);
 const flare=fx.active&&fx.phase===(side?3:4),height=fx.profile.immortal?156:137,y=s.site.y+height-168;
 ctx.save();ctx.translate(x,y);ctx.globalAlpha=side&&fx.shattered ? .05 : flare ? .36 : .15;
 ctx.strokeStyle=side?'#a55d84':fx.profile.immortal?'#dcb768':'#83b9ae';ctx.lineWidth=2;
 ctx.beginPath();ctx.ellipse(0,-height*.58,48,height*.49,0,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.ellipse(0,-height*.58,42,height*.42,0,0,Math.PI*2);ctx.stroke();
 warFigureV2841(ctx,side,height,false);ctx.globalAlpha=flare?.5:.24;
 warRuneV2841(ctx,0,0,55,15,side,t,.8);ctx.restore();
}
drawWarGroundV2840=function(ctx,view){
 const state=WAR_MAP_V2840,s=state.scene;if(!s||!warSceneVisibleV2840(s,view))return;
 const fx=warSpellStateV2841(s),t=state.reduced?0:state.clock,{x,y}=s.site;
 ctx.save();ctx.fillStyle='#57492a0b';ctx.beginPath();ctx.ellipse(x,y+4,159,109,0,0,Math.PI*2);ctx.fill();
 // Two separate ritual circles; no road or navigation connectors.
 for(let side=0;side<2;side++){const bx=x+(side?96:-96),broken=side&&fx.shattered;
  warRuneV2841(ctx,bx,y+10,67,88,side,t,broken?.25:.68);
  warDharmaV2841(ctx,s,fx,side);
 }
 if(s.step===1)warRuneV2841(ctx,x-92,y+92,25,9,0,t,.95);
 if(s.step===2)warRuneV2841(ctx,x+92,y+92,25,9,1,t,fx.shattered?.18:.95);
 ctx.restore();warFlagV2840(ctx,x-147,y-83,0,t,'阵');warFlagV2840(ctx,x+147,y-83,1,t,'煞');
};
function warWardV2841(ctx,s,fx,side){
 const x=s.site.x+(side?96:-96),y=s.site.y+5,shattered=side&&fx.shattered;
 const hit=fx.active&&fx.profile.level>0&&(side?fx.phase===2||fx.phase===4:fx.phase===3);
 const scar=side?0:(Number(s.record.morale)||60)<45?1:0;
 ctx.save();ctx.translate(x,y);ctx.lineWidth=hit?2:1.3;ctx.strokeStyle=side?'#b779aaa0':'#86c6c0b0';ctx.fillStyle=side?'#956c9610':'#90cbcb10';
 if(!shattered){ctx.beginPath();ctx.ellipse(0,-28,65,99,0,Math.PI,Math.PI*2);ctx.lineTo(65,15);ctx.ellipse(0,15,65,21,0,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();}
 else{ctx.globalAlpha=.35;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,-28,65,99,0,Math.PI+i*.7,Math.PI+i*.7+.34);ctx.stroke();}}
 if(hit||scar||shattered){ctx.strokeStyle=side?'#edbfd2':'#d4f2dc';ctx.globalAlpha=shattered?.28:hit?.65:.35;ctx.lineWidth=1.3;
  const sign=side?-1:1;ctx.beginPath();ctx.moveTo(sign*53,-51);ctx.lineTo(sign*32,-37);ctx.lineTo(sign*44,-16);ctx.lineTo(sign*26,3);ctx.moveTo(sign*32,-37);ctx.lineTo(sign*18,-44);ctx.stroke();
 }
 if(hit){const q=fx.progress;ctx.globalAlpha=Math.sin(q*Math.PI)*.4;ctx.strokeStyle=side?'#e8d3bc':'#d9eaf0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(side?-58:58,-30,8+q*17,13+q*27,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
function warSwordVolleyV2841(ctx,s,fx){
 if(!fx.active||fx.profile.level<1||![1,2,4].includes(fx.phase))return;
 const n=PERF_CONFIG.ultraSmooth?2:PERF_CONFIG.mobile?4:6,t=WAR_MAP_V2840.clock;
 for(let i=0;i<n;i++){
  const q=(t*.66+i/n)%1,x=s.site.x-103+q*174,y=s.site.y-90+i*(135/n)-Math.sin(q*Math.PI)*23;
  ctx.save();ctx.strokeStyle='#9bd6d47d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x-25,y+5);ctx.quadraticCurveTo(x-12,y+2,x,y);ctx.stroke();
  if(fx.profile.flying)warSwordV2841(ctx,x,y,-.15,25,0,.93);
  else{ctx.fillStyle='#e0cf83';ctx.fillRect(x-4,y-7,8,13);ctx.strokeStyle='#8c5b38';ctx.lineWidth=1;ctx.strokeRect(x-1,y-4,2,6);}
  ctx.restore();
 }
}
function warDemonFlameV2841(ctx,s,fx){
 if(!fx.active||fx.profile.level<1||fx.phase!==3)return;
 const n=PERF_CONFIG.ultraSmooth?2:4,t=WAR_MAP_V2840.clock;
 for(let i=0;i<n;i++){const q=(t*.53+i/n)%1,x=s.site.x+112-q*179,y=s.site.y-70+i*(119/n)+Math.sin(q*Math.PI)*15;
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#64365075';ctx.strokeStyle='#bb708aaa';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-9,0);ctx.quadraticCurveTo(8,-16,29,-6);ctx.quadraticCurveTo(10,-4,24,5);ctx.quadraticCurveTo(5,13,-9,0);ctx.fill();ctx.stroke();
  ctx.fillStyle='#de99a18c';ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
function warThunderV2841(ctx,s,fx){
 if(!fx.active||!fx.profile.thunder||fx.phase!==4)return;
 // One localized, steady bolt. No screen flash, shake or frame-rate particle emission.
 const x=s.site.x+92,y=s.site.y-37,q=fx.progress,alpha=Math.sin(q*Math.PI)*.8;
 ctx.save();ctx.globalAlpha=alpha;ctx.lineJoin='round';ctx.strokeStyle='#a4b7df';ctx.lineWidth=4;
 ctx.beginPath();ctx.moveTo(x+8,y-91);ctx.lineTo(x-7,y-65);ctx.lineTo(x+4,y-48);ctx.lineTo(x-6,y-20);ctx.lineTo(x,y+5);ctx.stroke();ctx.strokeStyle='#f1ecd3';ctx.lineWidth=1.3;ctx.stroke();ctx.beginPath();ctx.moveTo(x-7,y-65);ctx.lineTo(x-24,y-45);ctx.lineTo(x-18,y-29);ctx.stroke();
 ctx.strokeStyle='#d3ba8c';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y+10,15+q*23,5+q*9,0,0,Math.PI*2);ctx.stroke();ctx.restore();
}
drawWarEffectsV2840=function(ctx,view){
 const s=WAR_MAP_V2840.scene;if(!s||!warSceneVisibleV2840(s,view))return;const fx=warSpellStateV2841(s),{x,y}=s.site;
 ctx.save();warWardV2841(ctx,s,fx,0);warWardV2841(ctx,s,fx,1);warSwordVolleyV2841(ctx,s,fx);warDemonFlameV2841(ctx,s,fx);warThunderV2841(ctx,s,fx);
 ctx.textAlign='center';ctx.font='bold 14px serif';const title=warSpellCaptionV2841(s,fx),w=Math.min(298,ctx.measureText(title).width+28);
 ctx.fillStyle='#172923ec';ctx.strokeStyle='#b9a36c';ctx.lineWidth=1;ctx.fillRect(x-w/2,y-195,w,28);ctx.strokeRect(x-w/2,y-195,w,28);ctx.fillStyle='#f3dfab';ctx.fillText(title,x,y-176);
 ctx.font='12px serif';ctx.fillStyle='#264d45';ctx.fillText(player.sect+' · 护阵',x-83,y+112);ctx.fillStyle='#733d56';ctx.fillText(s.record.enemy+' · 煞阵',x+83,y+112);ctx.restore();
};
// Story language follows the same xianxia battle logic while preserving IDs and save stages.
WAR_FRONTS_V2839[0].objective='夺回前哨阵旗，接续传讯灵光';
WAR_FRONTS_V2839[0].intro='前哨阵旗被煞气遮蔽，传讯玉碑断了灵光。守阵弟子结印护住阵基，剑修等待破开魔障，将山门间的灵讯重新接通。';
WAR_FRONTS_V2839[1].intro='灵脉上空魔焰翻涌，护阵光幕已经出现裂纹。医修在阵后接应伤者，护阵弟子稳住灵流，御剑修士正设法截断魔焰来路。';
WAR_FRONTS_V2839[2].intro='魔阵核心终于显露。双方修士围绕阵眼施法相抗，必须破开核心禁制才能结束这场斗法。此战只是一域之争，三万年仙魔战仍未落幕。';
window.__xiantuBuildFilesV2814=window.__xiantuBuildFilesV2814||{};window.__xiantuBuildFilesV2814['xiantu-v2841-dharma-war.js']='28.68.50';
