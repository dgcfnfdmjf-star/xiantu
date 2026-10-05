'use strict';
// Numeric decision contracts only: no save files, NPC names or client prompts.
const CONTRACTS = Object.freeze({
  mapnpc: ['context: affinity, quest status (0 available,1 accepted,2 completed), materials ready (0/1), health percent, realm. options a: 0 intel,1 request quest help,2 guarded conversation,3 ordinary conversation.', 'Choose a fitting NPC response. Favor quest help when materials are ready, intel when the player needs guidance, guarded conversation at low affinity. No extra reward.'],
  elder: ['context: realm, contribution, gold, health percent. options a: task type (0 gather,1 combat,2 donation), b: requirement count, c: owned progress, d: contribution reward, e: gold cost.', 'Recommend an existing sect task. Favor completable gathering tasks, avoid unaffordable donations and combat when health is low. The player must confirm acceptance.'],
  merchant: ['context: gold, health percent, mana percent, realm. options a: item kind (0 gear,1 health pill,2 cultivation pill), b: price, c: gear score improvement or healing need, d: copies owned.', 'Recommend an affordable useful item, prioritizing positive equipment upgrades and health supplies when hurt. Avoid duplicate supplies. All items are legal and player must confirm payment.'],
  rival: ['context: player realm, rival realm, completed story chapters, duels, wins, health percent. options a: 0 next unlocked chapter,1 challenge,2 review history,3 converse.', 'Choose a fitting interaction for the rival Ye Wujiang. Favor an unlocked story chapter and recovery-oriented conversation at low health. Rival remains capped at quasi-saint; never unlock a chapter or grant a win.'],
  ally: ['context: player health percent, enemy health percent, ally mana (max60), ally turn. options a: 0 breathe (+12 mana),1 heal (18 mana,12% player maxHP),2 guard (12 mana,next enemy hit reduced20%),3 focus (16 mana,35% player attack minus defense).', 'Choose support using only available options. Heal wounded player, guard when danger is high, focus otherwise, breathe when mana is low. One action per enemy turn, cooldowns enforced by game.'],
  disciple: ['context: gold, idle disciples, realm, day. options: a=level, b=specialty match (0/1), c=days, d=gold reward, e=material count.', 'Choose an efficient legal assignment, balancing gold per day and specialist material yield.'],
  npc: ['context: affection (0..100), completed relationship events, partner (0/1), prior chats. options: a=tone (0=reserved,1=listening,2=warm).', 'Select a fitting response tone. Low affection favors reserved or listening, established mutual affection favors warmth. Never assume an uncompleted relationship event.'],
  war: ['context: enemy report (0=assault,1=fortified,2=split), morale, supplies, own/foe power percent, health percent. options: a=tactic (0=counter assault,1=flank fortification,2=concentrate against split).', 'Choose the tactic that counters the supplied enemy report. This selects tactics only, not a declaration, attack or spending.'],
  hero: ['context: health percent, mana percent, enemy health percent, strategy (0=burst,1=save,2=survive), heal threshold percent, reserve mana percent. options: a=mana cost as percent of maximum, b=damage multiplier times 100, c=healing percent, d=guard percent, e=local strategy preferred (0/1).', 'Choose a currently equipped affordable action. Prefer healing below the healing threshold, honor reserve for save mode, use guard for survival. Do not assume damage or healing can exceed actual game rules.'],
  secret: ['context: health percent, mana percent, realm, story chapter. options: a=event class (0=encounter,1=treasure,2=cultivation,3=crisis,4=npc,5=other), b=minimum realm, c=original encounter weight.', 'Choose an eligible secret realm event fitting the current condition. Prefer less risky events at low health. Selection does not increase reward amounts or the original event frequency.'],
  sect: ['context: gold, contribution, prosperity, management allowed (0/1), ready disciple jobs, idle disciples, active campaign (0/1). options: a=priority (0=commissions,1=disciple management,2=skill library,3=war preparation).', 'Choose an immediate management priority. Low resources favor commissions, completed or idle disciple jobs favor management, available contribution favors library, active campaign favors war preparation. Player confirms spending through existing game menus.']
});
function validWorldState(input) {
  if (!input || !Object.hasOwn(CONTRACTS,input.task) || input.version!==1) throw Error('task');
  const lengths={mapnpc:5,elder:4,merchant:4,rival:6,ally:4,disciple:4,npc:4,war:5,hero:6,secret:4,sect:7};
  const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1e9;
  if(!Array.isArray(input.context)||input.context.length!==lengths[input.task]||!input.context.every(num))throw Error('context');
  if(!Array.isArray(input.options)||input.options.length<2||input.options.length>16)throw Error('options');
  const options=input.options.map((o,i)=>{
    if(!o||o.id!=='o'+i||!['a','b','c','d','e'].every(k=>num(o[k])))throw Error('option');
    return {id:o.id,a:o.a,b:o.b,c:o.c,d:o.d,e:o.e};
  });
  return {task:input.task,version:1,context:input.context.slice(),options};
}
function worldProviderBody(state) {
  const [schema,instructions]=CONTRACTS[state.task];
  return {model:'jev-latest',state:{...state,schema},questions:{[state.task]:{type:'choice',instructions,criteria:Object.fromEntries(state.options.map(o=>[o.id,'Select this supplied legal option.']))}}};
}
module.exports={CONTRACTS,validWorldState,worldProviderBody};
