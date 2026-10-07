const fs=require('fs'),a=require('assert'),fixture=require('./dom-fixture.cjs');
const root=process.env.XIANTU_TEST_ROOT||require('node:path').resolve(__dirname,'..');
function game(level){const f=fixture(root);f.c.Math=Object.create(Math);f.c.Math.random=()=>.35;for(const file of JSON.parse(fs.readFileSync(root+'/game-v2762.html','utf8').match(/var files=(\[[^;]+\]);/)[1]))f.load(file);f.run(`startGame();closeWorldOverlay();player.level=${level};player.hp=getMaxHp();player.mp=getMaxMp();player.gold=10000;player.warState.alliedSects=Object.keys(HUMAN_FACTION_POWER).filter(n=>n!==player.sect);window.target=Object.keys(DEMON_FACTION_POWER)[0];executeWar(target);`);f.timers.clear();f.c.items=[];f.c.view={minX:0,maxX:2200,minY:0,maxY:1600};return f;}
for(const level of [0,1,2,4,5,9,10,16]){
 const f=game(level);f.run('appendWarUnitsV2840(items,0,view)');const profile=JSON.parse(f.run('JSON.stringify(warSpellStateV2841(WAR_MAP_V2840.scene).profile)'));
 a.equal(profile.flying,level>=2);a.equal(profile.dharma,level>=5);a.equal(profile.thunder,level>=9);a.equal(profile.immortal,level>=10);
 a(f.run('WAR_MAP_V2840.scene.units.filter(u=>u.rank===0).every(u=>u.liftV2841===0)'),'ground disciples stay grounded');
 a.equal(f.run('WAR_MAP_V2840.scene.units.some(u=>u.liftV2841>0)'),level>=2);
 a(f.run('WAR_MAP_V2840.scene.units.every(u=>u.frame===0&&!u.attack)'),'no marching/slash frames');
 const positions=f.run('JSON.stringify(WAR_MAP_V2840.scene.units.filter(u=>u.rank===0).map(u=>[u.x,u.y]))'),wallet=f.run('JSON.stringify({gold:player.gold,exp:player.exp,war:player.warState})'),timerCount=f.timers.size;
 for(const [clock,phase] of [[.5,0],[2.2,1],[4,2],[5.5,3],[7.2,4],[9,5],[10.1,0]]){
  f.run(`WAR_MAP_V2840.clock=${clock};items.length=0;appendWarUnitsV2840(items,0,view);updateWarMapBarV2840(WAR_MAP_V2840.scene)`);a.equal(f.run('warSpellStateV2841(WAR_MAP_V2840.scene).phase'),phase);a.equal(f.run('JSON.stringify(WAR_MAP_V2840.scene.units.filter(u=>u.rank===0).map(u=>[u.x,u.y]))'),positions);
 }
 a.equal(f.run('JSON.stringify({gold:player.gold,exp:player.exp,war:player.warState})'),wallet);a.equal(f.timers.size,timerCount,'no timers for choreography');
 f.run('WAR_MAP_V2840.reduced=true;items.length=0;appendWarUnitsV2840(items,1/30,view)');a(!f.run('warSpellStateV2841(WAR_MAP_V2840.scene).active'));const staticUnits=f.run('JSON.stringify(WAR_MAP_V2840.scene.units)');f.run('appendWarUnitsV2840(items,1/30,view)');a.equal(f.run('JSON.stringify(WAR_MAP_V2840.scene.units)'),staticUnits);
 f.run('WAR_MAP_V2840.reduced=false;player.level=16;appendWarUnitsV2840(items,0,view)');a.equal(f.run('warSpellStateV2841(WAR_MAP_V2840.scene).profile.level'),level,'campaign realm, not later upgrades');a.equal(f.errors.length,0,JSON.stringify(f.errors));
}
console.log('PASS realm gates at mortal/qi/foundation/soul/transformation/tribulation/immortal/saint; ground roles, casting cycle, frozen campaign realm, no render rewards/timers, reduced motion');
const end=game(6);end.run('warCampaignV2839().step=3;warCampaignV2839().records=[{stage:2,won:false}];syncWarMapV2840();appendWarUnitsV2840(items,0,view)');a.equal(end.run('warSpellStateV2841(WAR_MAP_V2840.scene).shattered'),0);a(!end.run('warSpellStateV2841(WAR_MAP_V2840.scene).active'));
end.run('warCampaignV2839().records[0].won=true;appendWarUnitsV2840(items,0,view)');a.equal(end.run('warSpellStateV2841(WAR_MAP_V2840.scene).shattered'),1);a.equal(end.run('player.warState.history.length'),0,'visual result waits for real settlement');
end.run('retreatWarV2775()');a.equal(end.run('WAR_MAP_V2840.scene'),null);a(!end.ids.has('warMapBarV2840'));
const incoming=game(5);incoming.run('retreatWarV2775();player.warState.incomingV2839={id:"spell-incoming",enemy:target,day:0};syncWarMapV2840();viewWarMapV2840();appendWarUnitsV2840(items,0,view)');a(!incoming.run('warSpellStateV2841(WAR_MAP_V2840.scene).active'));a.equal(incoming.errors.length,0,JSON.stringify(incoming.errors));
console.log('PASS enemy ward shatters only on recorded objective victory, quiet incoming/end states, cleanup');
