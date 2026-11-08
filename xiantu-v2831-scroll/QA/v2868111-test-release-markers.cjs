'use strict';
// V28.68.111 release markers: package version, loader build, CSS build, file stamps and one cache query agree.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const root=process.env.XIANTU_TEST_ROOT||path.resolve(__dirname,'..'),html=fs.readFileSync(root+'/game-v2762.html','utf8');
const version=require(path.join(root,'../package.json')).version,build=html.match(/var expectedBuild='([^']+)'/)[1];
a.equal(build,version,'loader build matches package.json');
a(html.includes('<title>仙途 V'+version+' ')&&html.includes('<div class="boot-version">V'+version+'</div>'),'visible version');
const css=fs.readFileSync(root+'/xiantu-v2762.css','utf8'),cssBuild=build.replace(/^28\./,'28').replaceAll('.','');
a.equal(css.match(/--xiantu-build:(\d+);/)[1],cssBuild);a(html.includes("trim()!=='"+cssBuild+"'"),'loader checks CSS build');
const queries=new Set([...html.matchAll(/\.(?:css|js|webmanifest|png|'\+name\+')\?v=([\w-]+)/g)].map(m=>m[1]));a.equal(queries.size,1,'single cache query');a([...queries][0].startsWith(cssBuild+'-'));
const files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
for(const file of files){const src=fs.readFileSync(path.join(root,file),'utf8'),m=src.match(/__xiantuBuildFilesV2814\[["']([^"']+)["']\]\s*=\s*["']([^"']+)["']/);a(m&&m[1]===file,'stamp '+file);a.equal(m[2],version,'stamp '+file);}
console.log('PASS v2868111 release markers');
