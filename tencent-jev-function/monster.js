'use strict';
const ACTIONS = Object.freeze({
  probe: 'Human cultivator probing strike: 0.85x damage, costs 8 mana.',
  rally: 'Human calls allied spirit formation: spends turn and 20 mana; next two direct attacks gain 15% damage. Cannot stack.',
  retreat: 'Human withdraws from an ordinary roaming encounter. Costs turn, no rewards or quest kills; only offered when withdrawal is allowed.',
  attack: 'Normal attack. No mana cost.',
  heavy: 'Heavy attack: 1.25x normal attack multiplier, costs 18 mana; cooldown restricts availability.',
  guard: 'Spend this turn and 10 mana to reduce the next direct player hit by 30%, expires at next enemy turn. Does not block pets or damage over time.',
  recover: 'Spend this turn to restore 22 mana, capped at 100.',
  heal: 'Spend this turn and 28 mana to restore 8% maximum health; at most twice per battle, cooldown restricts availability.',
  spell: 'Use the current unlocked monster spell, costs 32 mana. Its attack multiplier is spellPower. Cooldown restricts availability.'
});
function validMonsterState(input) {
  if(input.version!==1)throw Error('version');
  const out={task:'monster',version:1};
  for(const [key,min,max] of [['round',1,999],['phase',1,4],['enemyHp',0,100],['enemyMp',0,100],['playerHp',0,100],['playerMp',0,100]]) {
    if(!Number.isInteger(input[key])||input[key]<min||input[key]>max)throw Error('number');
    out[key]=input[key];
  }
  for(const key of ['playerGuard','enemyWeakened']) {
    if(typeof input[key]!=='boolean')throw Error('boolean');out[key]=input[key];
  }
  if(typeof input.spellPower!=='number'||!Number.isFinite(input.spellPower)||input.spellPower<0||input.spellPower>5)throw Error('power');
  out.spellPower=input.spellPower;
  if(input.actor!==undefined){
    if(!['human','rival'].includes(input.actor)||typeof input.canRetreat!=='boolean'||!Number.isInteger(input.supportTurns)||input.supportTurns<0||input.supportTurns>2)throw Error('actor');
    for(const key of ['duels','wins'])if(!Number.isSafeInteger(input[key])||input[key]<0||input[key]>1e9)throw Error('history');
    if(input.wins>input.duels||input.actor==='rival'&&input.canRetreat)throw Error('history');
    Object.assign(out,{actor:input.actor,canRetreat:input.canRetreat,supportTurns:input.supportTurns,duels:input.duels,wins:input.wins});
  }
  if(!Array.isArray(input.available)||input.available.length<2||input.available.length>9||new Set(input.available).size!==input.available.length||!input.available.includes('attack')||input.available.some(k=>typeof k!=='string'||!Object.hasOwn(ACTIONS,k)))throw Error('actions');
  out.available=Object.keys(ACTIONS).filter(k=>input.available.includes(k));
  const costs={probe:8,rally:20,heavy:18,guard:10,heal:28,spell:32};
  if(out.available.some(k=>(costs[k]||0)>out.enemyMp)||out.available.includes('heal')&&out.enemyHp>92||out.available.includes('recover')&&out.enemyMp>78||out.available.includes('spell')&&out.spellPower<=0)throw Error('unavailable');
  if(out.available.some(k=>['probe','rally','retreat'].includes(k))&&!out.actor)throw Error('actor');
  if(out.available.includes('retreat')&&(!out.canRetreat||out.actor==='rival'||out.enemyHp>25))throw Error('retreat');
  if(out.available.includes('rally')&&out.supportTurns>0)throw Error('rally');
  return out;
}
function monsterProviderBody(state) {
  return {model:'jev-latest',state:{...state,rules:'All health and mana are percentages. Monster mana capacity is 100. Only public current vitals are known, not the player next input, inventory or equipment. Every action consumes one turn. No stat creation, resurrection, reward or item changes. Available actions were checked for mana, phase, cooldown and heal quota by the game.'},
    questions:{monster:{type:'choice',instructions:'Choose a sensible combat action from available actions only. Actor human means a hostile cultivator; consider probing, rallying allies or withdrawing when wounded if offered. Actor rival is Ye Wujiang: use phase spells and previous duel record, never retreat or assume a higher realm than supplied; quasi-saint is his permanent ceiling. Prefer survival when critically injured and healing is available, avoid wasting mana into playerGuard, consider recovering low mana, and favor attacks when the player is weak. Do not invent additional effects or assume unknown damage/kill certainty.',criteria:Object.fromEntries(state.available.map(k=>[k,ACTIONS[k]]))}}};
}
exports.validMonsterState=validMonsterState;
exports.monsterProviderBody=monsterProviderBody;
