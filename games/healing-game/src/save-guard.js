/* Journey save guard. A save that cannot be read is kept aside and never overwritten by automatic saves.
 * Every successful write first copies the previous readable save to <key>.bak; reads fall back to it. */
(function(root){
  'use strict';
  function parse(raw){
    if(raw===null||raw===undefined)return null;
    try{var d=JSON.parse(raw);return d&&typeof d==='object'&&!Array.isArray(d)?d:undefined;}catch(e){return undefined;}
  }
  function create(storage,key,now){
    var bak=key+'.bak',st={loadFailed:false,restored:false,corruptKey:null};
    function get(k){try{return storage.getItem(k);}catch(e){return null;}}
    // Returns the stored object, the .bak copy when the main save is unreadable, or null for a fresh start.
    function read(){
      var raw=get(key),d=parse(raw);
      if(d)return d;
      if(d===undefined){
        st.corruptKey=key+'.corrupt-'+(now?now():Date.now());
        try{storage.setItem(st.corruptKey,raw);}catch(e){st.corruptKey=null;}
      }
      var b=parse(get(bak));
      if(b){st.restored=true;return b;}
      if(d===undefined)st.loadFailed=true;
      return null;
    }
    // auto: pagehide/visibility/startup writes; skipped while an unreadable save is protected.
    // A non-auto write means real new progress this session; the original stays under corruptKey.
    function write(json,auto){
      if(st.loadFailed&&auto)return 'blocked';
      var prev=get(key);
      if(parse(prev)){try{storage.setItem(bak,prev);}catch(e){}}
      storage.setItem(key,json);
      st.loadFailed=false;
      return 'saved';
    }
    return {read:read,write:write,status:function(){return {loadFailed:st.loadFailed,restored:st.restored,corruptKey:st.corruptKey};}};
  }
  var api={create:create,parse:parse};root.SaveGuard=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
