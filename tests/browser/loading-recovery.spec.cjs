'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../xiantu-v2831-scroll/game-v2762.html'),'utf8');
const files=JSON.parse(html.match(/var files=(\[[^;]+\]);/)[1]);
const build=html.match(/var expectedBuild='([^']+)'/)[1];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test.use({viewport:{width:390,height:844}});
async function isolate(page){
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.addInitScript(()=>{window.__loadingAuditOrder=[];window.__loadingAuditDocument=Math.random();});
}
async function scripts(page,intercept=async()=>false){
  await page.route('**/*.js?*',async route=>{
    const url=new URL(route.request().url()),name=url.pathname.split('/').pop();
    if(!files.includes(name))return route.continue();
    if(await intercept(route,url,name))return;
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+'\n;window.__loadingAuditOrder.push('+JSON.stringify(name)+');'});
  });
}
async function begin(page){
  await page.goto('/game-v2762.html',{waitUntil:'domcontentloaded'});
  await page.locator('#introSkipChoiceV2898').check();
  // Dispatch extra taps in the same turn, before any later fatal-error refresh action exists.
  await page.locator('#xiantuSafeBootButton').evaluate(button=>{button.click();for(let i=0;i<3;i++)button.dispatchEvent(new Event('click'));});
}
async function readyOnce(page){
  await expect(page.locator('html')).toHaveClass(/xiantu-v2762-ready/,{timeout:15000});
  expect(await page.evaluate(()=>window.__loadingAuditOrder)).toEqual(files);
}

for(const target of ['stylesheet','script'])test(`${target} arriving after 18 seconds resumes without duplicate execution`,async({page})=>{
  await isolate(page);
  await scripts(page,async(route,url,name)=>{if(target==='script'&&name===files[0])await sleep(18000);return false;});
  if(target==='stylesheet')await page.route('**/xiantu-v2762.css?*',async route=>{await sleep(18000);await route.continue();});
  await begin(page);
  await expect(page.locator('#xiantuSafeBootProgress')).toContainText('仍在加载',{timeout:17000});
  await expect(page.locator('#xiantuSafeBootButton')).toBeDisabled();
  await expect(page.locator('#xiantuSafeBootError')).toBeHidden();
  await readyOnce(page);
});

test('a failed CSS download retries only the stylesheet and continues',async({page})=>{
  await isolate(page);await scripts(page);
  const retries=[];
  await page.route('**/xiantu-v2762.css?*',async route=>{
    const retry=new URL(route.request().url()).searchParams.get('retry');retries.push(retry);
    if(retry===null)return route.abort('connectionreset');
    await route.continue();
  });
  await begin(page);await readyOnce(page);
  expect(retries).toContain(null);expect(retries.filter(value=>value==='1')).toHaveLength(1);
  expect(await page.locator('link[rel="stylesheet"]').count()).toBe(1);
});

test('repeated script failure waits for manual retry and preserves completed modules',async({page})=>{
  await isolate(page);
  const failedIndex=3,target=files[failedIndex],retries=[];
  await scripts(page,async(route,url,name)=>{
    if(name!==target)return false;
    const retry=url.searchParams.get('retry');retries.push(retry);
    if(retry!=='2'){await route.abort('connectionreset');return true;}return false;
  });
  await begin(page);
  const button=page.locator('#xiantuSafeBootButton');
  await expect(button).toHaveText('重试继续加载',{timeout:10000});
  expect(await page.evaluate(()=>window.__loadingAuditOrder)).toEqual(files.slice(0,failedIndex));
  const documentId=await page.evaluate(()=>window.__loadingAuditDocument);
  await page.evaluate(()=>{const button=document.getElementById('xiantuSafeBootButton');for(let i=0;i<4;i++)button.dispatchEvent(new Event('click'));});
  await readyOnce(page);
  expect(await page.evaluate(()=>window.__loadingAuditDocument)).toBe(documentId);
  expect(retries.filter(value=>value==='1')).toHaveLength(1);
  expect(retries.filter(value=>value==='2')).toHaveLength(1);
  expect(await page.locator('script[src]').count()).toBe(40);
});

for(const target of ['stylesheet','script'])test(`${target} version mismatch never retries or starts gameplay`,async({page})=>{
  await isolate(page);
  await scripts(page,async(route,url,name)=>{
    if(target!=='script'||name!==files[0])return false;
    const response=await route.fetch(),original=await response.text();
    const body=original.replaceAll(JSON.stringify(build),'"invalid-build"');expect(body).not.toBe(original);
    await route.fulfill({response,body});return true;
  });
  if(target==='stylesheet')await page.route('**/xiantu-v2762.css?*',async route=>{
    const response=await route.fetch(),original=await response.text();
    const body=original.replace(/--xiantu-build:\s*\d+/,'--xiantu-build:0');expect(body).not.toBe(original);
    await route.fulfill({response,body});
  });
  await begin(page);
  await expect(page.locator('#xiantuSafeBootError')).toContainText('版本不一致');
  await expect(page.locator('#xiantuSafeBootButton')).toHaveText('刷新后重试');
  await expect(page.locator('html')).not.toHaveClass(/xiantu-v2762-ready/);
  expect(await page.evaluate(()=>window.__loadingAuditOrder)).toEqual([]);
  expect(await page.locator('script[src*="retry="]').count()).toBe(0);
});

test('runtime errors are fatal and never execute the failed module again',async({page})=>{
  await isolate(page);
  await scripts(page,async(route,url,name)=>{
    if(name!==files[0])return false;
    const response=await route.fetch();
    await route.fulfill({response,body:await response.text()+'\n;throw new Error("loader runtime regression");'});return true;
  });
  await begin(page);
  await expect(page.locator('#xiantuSafeBootError')).toContainText('loader runtime regression');
  await expect(page.locator('#xiantuSafeBootButton')).toHaveText('刷新后重试');
  await expect(page.locator('html')).not.toHaveClass(/xiantu-v2762-ready/);
  expect(await page.locator('script[src]').count()).toBe(1);
});
