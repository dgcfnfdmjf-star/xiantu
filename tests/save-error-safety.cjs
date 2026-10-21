'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../xiantu-v2831-scroll/xiantu-v2762-core.js'),'utf8');
function harness(ready=true){
 const nodes=new Map(),events={},store=new Map(),removed=[],warnings=[];
 function element(){return {style:{},children:[],setAttribute(){},appendChild(child){this.children.push(child);child.parentNode=this;if(child.id)nodes.set(child.id,child);},remove(){nodes.delete(this.id);this.parentNode=null;}};}
 const document={body:element(),createElement:element,getElementById:id=>nodes.get(id),documentElement:{classList:{contains:()=>ready}}};
 const context=vm.createContext({window:{addEventListener:(type,fn)=>events[type]=fn},document,console:{error(){},warn:(...x)=>warnings.push(x)},localStorage:{getItem:k=>store.get(k)||null,removeItem:k=>{removed.push(k);store.delete(k);}},CULTIVATION_REALMS:Array(16),SAVE_KEY:'xiantu_save',SAVE_BACKUP_KEY:'xiantu_save_backup',SAVE_VERSION:12});
 vm.runInContext(source.slice(0,source.indexOf('// ================== 手机版储物袋')),context);
 vm.runInContext(source.slice(source.indexOf('    function validateSaveTextV2869'),source.indexOf('    // Incomplete battles')),context);
 vm.runInContext(source.slice(source.indexOf('    function loadGame()'),source.indexOf('    function showSaveIndicator()')),context);
 return {context,events,store,removed,nodes,warnings};
}
test('deleting a save removes fallback too and preserves unrelated storage',()=>{
 const h=harness();const save=JSON.stringify({version:12,player:{level:1,inventory:[],gold:1,exp:0,hp:10,mp:10}});
 h.store.set('xiantu_save',save);h.store.set('xiantu_save_backup',save);h.store.set('preferences','keep');
 assert.equal(h.context.loadGame().player.gold,1);assert.equal(h.context.deleteSave(),true);assert.equal(h.context.loadGame(),null);assert.equal(h.store.get('preferences'),'keep');
});
test('backup deletion is attempted first; a failure is reported and primary retained',()=>{
 const h=harness();h.store.set('xiantu_save','original');h.context.localStorage.removeItem=k=>{throw Error('storage blocked');};
 assert.equal(h.context.deleteSave(),false);assert.equal(h.store.get('xiantu_save'),'original');assert.equal(h.warnings.length,1);
});
test('runtime error has a dismissible notice without claiming startup failure',()=>{
 const h=harness();h.events.error({message:'<img src=x>'});assert(!h.nodes.has('mobileBootError'));
 const box=h.nodes.get('mobileRuntimeError');assert(box);assert(!box.textContent.includes('<img'));assert(box.children[0].onclick);box.children[0].onclick();assert(!h.nodes.has('mobileRuntimeError'));
});
test('boot errors retain startup guidance; repeated errors reuse a single notice',()=>{
 const h=harness(false);h.events.error({message:'boot failed'});h.events.error({message:'again'});assert(h.nodes.get('mobileBootError').textContent.includes('未能启程'));assert.equal(h.nodes.size,1);
});
