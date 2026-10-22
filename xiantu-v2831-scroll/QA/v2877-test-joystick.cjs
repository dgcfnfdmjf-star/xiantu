const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');
function fixture(){const handlers={},padHandlers={},classes=new Set(),knob={style:{}},pad={dataset:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},addEventListener:(k,f)=>{(padHandlers[k]||=[]).push(f)},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),setPointerCapture(){throw Error('capture unavailable')},releasePointerCapture(){}};
 const listen=(k,f)=>(handlers[k]||=[]).push(f),ctx={document:{readyState:'complete',hidden:false,getElementById:id=>id==='virtualJoystick'?pad:knob,addEventListener:listen},navigator:{},FLAT_WORLD:{keys:{},target:{x:1}},addEventListener:listen,Math,window:null};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/xiantu-v2762-03-virtual-joystick-script.js','utf8'),ctx);
 const event=(type,more={})=>({type,pointerId:1,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:82,clientY:50,preventDefault(){},stopPropagation(){},...more});
 return {ctx,pad,knob,classes,down:(more={})=>{for(const f of padHandlers.pointerdown||[])f(event('pointerdown',more))},emit:(type,more={},local=false)=>{for(const f of (local?padHandlers:handlers)[type]||[])f(event(type,more))}};}
function stopped(f){a.equal(f.classes.has('active'),false);a.equal(f.knob.style.transform,'translate(-50%,-50%)');a(!['w','a','s','d'].some(k=>f.ctx.FLAT_WORLD.keys[k]));}
let f=fixture();f.down();a.equal(f.ctx.FLAT_WORLD.keys.d,true);f.emit('pointerup');stopped(f); // Reproduces release outside pad when capture failed.
f=fixture();f.down();f.emit('pointercancel');stopped(f);
f=fixture();f.down();f.emit('pointerup',{pointerId:2,isPrimary:false});a.equal(f.classes.has('active'),true);f.emit('touchend',{touches:[{}]});a.equal(f.classes.has('active'),true);f.emit('touchend',{touches:[]});stopped(f);
f=fixture();f.down();f.down({pointerId:2,isPrimary:false,clientX:18});a.equal(f.ctx.FLAT_WORLD.keys.d,true);f.down({pointerId:3,isPrimary:true,clientX:18});a.equal(f.ctx.FLAT_WORLD.keys.a,true);f.emit('lostpointercapture',{pointerId:1},true);a.equal(f.classes.has('active'),true);f.emit('pointerup',{pointerId:3});stopped(f);
for(const type of ['blur','pagehide','resize','orientationchange','xiantu-movement-reset']){f=fixture();f.down();f.emit(type);stopped(f);f.down();a.equal(f.ctx.FLAT_WORLD.keys.d,true);}
f=fixture();f.down();f.ctx.document.hidden=true;f.emit('visibilitychange');stopped(f);
f=fixture();f.down({pointerType:'mouse'});f.emit('pointermove',{pointerType:'mouse',buttons:0},true);stopped(f);
f=fixture();f.ctx.FLAT_WORLD.keys.w=true;f.emit('pointerup');a.equal(f.ctx.FLAT_WORLD.keys.w,true);f.down({pointerType:'mouse',button:2});a.equal(f.classes.has('active'),false);
console.log('PASS capture failure/outside release, cancellation, multitouch ownership, primary restart, stale lost capture, lifecycle reset and idle keyboard preservation');
