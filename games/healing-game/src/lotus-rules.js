/* 月汐莲湾: permanent, untimed light-giving; every valid gesture is welcome. */
(function(root){
  'use strict';
  var blooms = [
    {id:'moonpearl',name:'月珠莲',color:0xe9edff,note:'把月亮的一小片，放进掌心。'},
    {id:'tideglass',name:'潮璃莲',color:0x90e6e1,note:'潮水慢慢来，心也慢慢安静。'},
    {id:'rosecloud',name:'霞梦莲',color:0xf4b8d1,note:'晚霞没有走远，只是睡在花里。'},
    {id:'goldwish',name:'愿灯莲',color:0xffd79b,note:'愿每一份温柔，都有停靠的地方。'},
    {id:'violetrest',name:'紫憩莲',color:0xc6b5f4,note:'今天已经做得很好，可以歇一会儿。'},
    {id:'dawnletter',name:'晓信莲',color:0xb3e3c6,note:'明天会带着新的光，轻轻到来。'}
  ];
  function normalize(raw){
    var values=raw&&Array.isArray(raw.light)?raw.light:[];
    var light=blooms.map(function(_,i){var v=values[i];return typeof v==='number'&&isFinite(v)&&Math.floor(v)===v&&v>=0&&v<=3?v:0;});
    return {light:light,found:blooms.filter(function(_,i){return light[i]===3;}).map(function(b){return b.id;})};
  }
  function give(state,index){
    if(typeof index!=='number'||Math.floor(index)!==index||index<0||index>=blooms.length)return {changed:false};
    if(state.light[index]>=3)return {changed:false,free:true};
    state.light[index]++;
    var bloomed=state.light[index]===3;
    if(bloomed&&state.found.indexOf(blooms[index].id)<0)state.found.push(blooms[index].id);
    return {changed:true,bloomed:bloomed,finished:state.light.every(function(n){return n===3;})};
  }
  var api={blooms:blooms,normalize:normalize,give:give};root.LotusRules=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
