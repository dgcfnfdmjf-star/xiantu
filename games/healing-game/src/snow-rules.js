/* Chapter 6 「雪灯归林」 rules: pure and Node-testable. Light snow lanterns along a winding path and
 * walk lost kittens home to the cabin. No timer, no fail state; earned progress is never taken back. */
(function(root){
  'use strict';
  var LANTERNS=6;
  // Kitten ids match window.__kittens.kinds / src/cat-models.js, so the four local Blender cats are reused.
  var kittens=[
  // `lantern`: the kitten waits beside that lantern; it can follow the light once lanterns 0..lantern are all lit.
    {id:'orange',name:'小橘',color:0xf2a65a,lantern:1,note:'循着第一段灯光，找到了回家的路。'},
    {id:'calico',name:'花卷',color:0xe8c9a0,lantern:2,note:'雪花落在耳尖，也不怕了。'},
    {id:'black',name:'墨团',color:0x4a4658,lantern:4,note:'夜再深，窗里的灯也一直亮着。'},
    {id:'tabby',name:'虎斑',color:0xb98a5e,lantern:5,note:'最后一个到家，炉火正暖。'}
  ];
  var ids=kittens.map(function(k){return k.id;});
  function int(v,max){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>=0&&v<=max;}
  // Any old or damaged value becomes a valid, sorted, duplicate-free state. Unknown fields are dropped.
  function normalize(raw){
    raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
    var lit=[],home=[];
    if(Array.isArray(raw.lit))raw.lit.forEach(function(v){if(int(v,LANTERNS-1)&&lit.indexOf(v)<0)lit.push(v);});
    if(Array.isArray(raw.home))ids.forEach(function(id){if(raw.home.indexOf(id)>=0)home.push(id);});
    lit.sort(function(a,b){return a-b;});
    return {version:1,lit:lit,home:home};
  }
  function finished(s){return s.lit.length===LANTERNS&&s.home.length===kittens.length;}
  function progressText(s){return s.lit.length+' / '+LANTERNS+' 盏雪灯 · '+s.home.length+' / '+kittens.length+' 只小猫';}
  // The lowest unlit lantern (the one that gently pulses), or -1 when all are lit.
  function next(s){for(var i=0;i<LANTERNS;i++)if(s.lit.indexOf(i)<0)return i;return -1;}
  // How many more lanterns must be lit before this kitten can see the way (0 = ready).
  function darkness(s,k){var n=0;for(var i=0;i<=kittens[k].lantern;i++)if(s.lit.indexOf(i)<0)n++;return n;}
  function reachable(s,k){return darkness(s,k)===0&&s.home.indexOf(kittens[k].id)<0;}
  // act(state,'lantern'|'kitten',index) -> {changed,progress,hint,finished}. Mutates s only on progress.
  // Wrong or repeated taps never change or lose anything; they only return a kind hint.
  function act(s,kind,i){
    var out={changed:false,progress:false,hint:null,finished:finished(s)};
    if(kind==='lantern'){
      if(!int(i,LANTERNS-1)){out.hint='none';return out;}
      if(s.lit.indexOf(i)>=0){out.hint='lit';return out;}
      if(i!==next(s)){out.hint='far';return out;}
      s.lit.push(i);s.lit.sort(function(a,b){return a-b;});
    }else if(kind==='kitten'){
      if(!int(i,kittens.length-1)){out.hint='none';return out;}
      if(s.home.indexOf(kittens[i].id)>=0){out.hint='home';return out;}
      if(darkness(s,i)){out.hint='dark';return out;}
      s.home.push(kittens[i].id);s.home=ids.filter(function(id){return s.home.indexOf(id)>=0;});
    }else{out.hint='none';return out;}
    out.changed=out.progress=true;out.finished=finished(s);return out;
  }
  var api={LANTERNS:LANTERNS,kittens:kittens,normalize:normalize,finished:finished,progressText:progressText,next:next,darkness:darkness,reachable:reachable,act:act};
  root.SnowRules=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
