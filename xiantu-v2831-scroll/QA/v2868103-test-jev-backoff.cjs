'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..');let now=100000,calls=0,mode='offline',headers;
const c=vm.createContext({console,Date:{now:()=>now},Promise,Error,AbortController,setTimeout,clearTimeout,localStorage:{getItem:()=>null,setItem(){}},document:{querySelectorAll:()=>[]},window:{},FORGE_ADVICE_V2842:{},forgeJevEndpointV2842:()=>'/gateway',fetch:async(url,o)=>{calls++;headers=o.headers;if(mode==='offline')throw Error('offline');const status=mode===401&&JSON.parse(o.body||'{}').task==='session'?200:mode;return {ok:status===200,status,json:async()=>({mode:'public',token:'newtoken.'+'a'.repeat(43),expiresAt:now+600000})};}});
const run=s=>vm.runInContext(s,c);run(fs.readFileSync(root+'/xiantu-v2850-jev-friends.js','utf8'));
const attempt=()=>run("jevFetchV2850('/gateway',{headers:{'X-Xiantu-Access':JEV_PUBLIC_MARKER_V2850}})");
(async()=>{
 run("JEV_FRIENDS_V2850.mode=true;JEV_FRIENDS_V2850.token='synthetic';JEV_FRIENDS_V2850.expiresAt=Date.now()+600000");
 for(let i=0;i<20;i++)await a.rejects(attempt());a.equal(calls,1);a.equal(run('jevTransportV2868103.retryAt'),now+15000);a.equal(headers['X-Xiantu-Access'],undefined);a.equal(headers['X-Xiantu-Session'],'synthetic');
 now+=15000;await a.rejects(attempt());a.equal(calls,2);a.equal(run('jevTransportV2868103.retryAt'),now+30000);
 now+=30000;mode=503;await attempt();a.equal(calls,3);await a.rejects(attempt(),/jev_wait/);a.equal(calls,3);a.equal(run('jevTransportV2868103.retryAt'),now+60000);
 now+=60000;mode=200;await attempt();a.equal(run('jevTransportV2868103.failures'),0);mode=429;await attempt();await a.rejects(attempt(),/jev_wait/);a.equal(run('jevTransportV2868103.retryAt'),now+15000);
 // A private-access path has an independent scope; its failures also back off.
 mode='offline';const old=calls;for(let i=0;i<12;i++)await a.rejects(run("jevFetchV2850('/gateway',{headers:{'X-Xiantu-Access':'synthetic-private-code'}})"));a.equal(calls,old+1);
 // Public session refusal does not poison private requests, nor leak tickets to other hosts.
 run('JEV_FRIENDS_V2850.retryAt=Infinity');mode=200;await run("jevFetchV2850('/gateway',{headers:{'X-Xiantu-Access':'changed-private-code'}})");const before=calls;await a.rejects(run("jevFetchV2850('/wrong-host',{headers:{'X-Xiantu-Access':JEV_PUBLIC_MARKER_V2850}})"),/public_endpoint/);a.equal(calls,before);
 // Aborted operations never send; explicit retry remains limited by the existing guard.
 await a.rejects(run("(()=>{const controller=new AbortController();controller.abort();return jevFetchV2850('/gateway',{headers:{'X-Xiantu-Access':'another-private-code'},signal:controller.signal})})()"));a.equal(calls,before);
 mode='offline';run('JEV_FRIENDS_V2850.token="";JEV_FRIENDS_V2850.retryAt=0');await run('retryJevFriendsV2850()');const after=calls;for(let i=0;i<8;i++)await run('retryJevFriendsV2850()');a.equal(calls,after);
 // Expired-session recovery is still attempted only once after an HTTP 401.
 now+=5000;mode=200;await run('retryJevFriendsV2850()');mode=401;const authStart=calls;await attempt();a.equal(calls,authStart+3,'two decisions plus one ticket refresh');
 console.log('PASS cached-ticket and private transport backoff, exponential delay/HTTP 429/503, recovery reset, endpoint/auth isolation, cancellation, manual retry gate and bounded 401 refresh');
})().catch(e=>{console.error(e);process.exitCode=1});
