/* Six calm goals. Wrong choices offer a hint; earned progress never resets. */
(function(root){
  'use strict';
  var blooms=[
    {id:'moonpearl',name:'月珠莲',color:0xe9edff,note:'把月亮的一小片，放进掌心。',goal:'接住月露',help:'按花心里的颜色，接住三滴月露。'},
    {id:'tideglass',name:'潮璃莲',color:0x90e6e1,note:'潮水慢慢来，心也慢慢安静。',goal:'转动月镜',help:'转动水镜，让光线对准发亮的刻度，再送入花心。'},
    {id:'rosecloud',name:'霞梦莲',color:0xf4b8d1,note:'晚霞没有走远，只是睡在花里。',goal:'引光归来',help:'牵住中央的光，依次经过三颗路标；也可以点路标按钮。'},
    {id:'goldwish',name:'愿灯莲',color:0xffd79b,note:'愿每一份温柔，都有停靠的地方。',goal:'调和晨曦',help:'先收一束暖光、一束冷光，再让两束光相遇。'},
    {id:'violetrest',name:'紫憩莲',color:0xc6b5f4,note:'今天已经做得很好，可以歇一会儿。',goal:'铺好归途',help:'轻转三片叶舟，让它们的光纹都朝向月亮 ↑。'},
    {id:'dawnletter',name:'晓信莲',color:0xb3e3c6,note:'明天会带着新的光，轻轻到来。',goal:'回应晚安',help:'听一遍或看编号，奏回 1 → 3 → 2。按错也保留已经找到的音。'}
  ];
  var dew=[0,2,1],mirror=[2,5,1],song=[0,2,1],leafStart=[1,3,2];
  function int(v,max){return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>=0&&v<=max;}
  function normalize(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var values=Array.isArray(raw.light)?raw.light:[],light=blooms.map(function(_,i){return int(values[i],3)?values[i]:0;});
    var leaves=Array.isArray(raw.leaves)?leafStart.map(function(v,i){return int(raw.leaves[i],3)?raw.leaves[i]:v;}):leafStart.slice();
    // Legacy V9 progress is retained; its first n leaf tasks are already solved.
    var aligned=leaves.filter(function(n){return n===0;}).length;
    for(var i=0;aligned<light[4]&&i<3;i++)if(leaves[i]!==0){leaves[i]=0;aligned++;}
    light[4]=aligned;
    return {version:2,light:light,found:blooms.filter(function(_,i){return light[i]===3;}).map(function(b){return b.id;}),mirror:int(raw.mirror,5)?raw.mirror:0,leaves:leaves};
  }
  function current(s){for(var i=0;i<6;i++)if(s.light[i]<3)return i;return -1;}
  function act(s,i,kind,value){
    if(!int(i,5)||typeof kind!=='string')return {changed:false};
    if(s.light[i]===3)return {changed:false,free:true};
    if(current(s)!==i)return {changed:false,locked:true};
    var n=s.light[i],correct=false,changed=false;
    if(i===0&&kind==='color')correct=value===dew[n];
    if(i===1){
      if(kind==='turn'&&(value===1||value===-1)){s.mirror=(s.mirror+value+6)%6;return {changed:true,progress:false};}
      if(kind==='shine')correct=s.mirror===mirror[n];
    }
    if(i===2&&kind==='guide')correct=value===n;
    if(i===3&&kind==='blend')correct=value===['warm','cool','join'][n];
    if(i===4&&kind==='leaf'&&int(value,2)){
      if(s.leaves[value]===0)return {changed:false};
      s.leaves[value]=(s.leaves[value]+1)%4;changed=true;
      if(s.leaves[value]===0)correct=true;
    }
    if(i===5&&kind==='note')correct=value===song[n];
    if(!correct)return {changed:changed,progress:false,hint:true};
    s.light[i]++;if(s.light[i]===3&&s.found.indexOf(blooms[i].id)<0)s.found.push(blooms[i].id);
    return {changed:true,progress:true,bloomed:s.light[i]===3,finished:current(s)<0};
  }
  var api={blooms:blooms,normalize:normalize,current:current,act:act,dew:dew,mirror:mirror,song:song};root.LotusRules=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
