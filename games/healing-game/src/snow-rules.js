/* Chapter 6 「雪灯归林」 rules: pure and Node-testable. Light snow lanterns along a winding path and
 * walk lost kittens home to the cabin. No timer, no fail state; earned progress is never taken back. */
(function(root){
  'use strict';
  var LANTERNS=6;
  // Kitten ids match window.__kittens.kinds / src/cat-models.js, so the four local Blender cats are reused.
  var kittens=[
    {id:'orange',name:'橘子',color:0xf2a65a,note:'循着第一盏灯，找到了回家的路。'},
    {id:'calico',name:'花卷',color:0xe8c9a0,note:'雪花落在耳尖，也不怕了。'},
    {id:'black',name:'墨团',color:0x4a4658,note:'夜再深，窗里的灯也一直亮着。'},
    {id:'tabby',name:'虎斑',color:0xb98a5e,note:'最后一个到家，炉火正暖。'}
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
  var api={LANTERNS:LANTERNS,kittens:kittens,normalize:normalize,finished:finished,progressText:progressText};
  root.SnowRules=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
