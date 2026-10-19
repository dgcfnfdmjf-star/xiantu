#!/usr/bin/env node
'use strict';
/*
 * map-wrappers.cjs: maps statically detected function definitions, wrappers and overwrites
 * across the scripts loaded by game-v2762.html, in load order.
 *
 * Usage (from the repository root):
 *   node scripts/map-wrappers.cjs
 *   node scripts/map-wrappers.cjs --html xiantu-v2831-scroll/game-v2762.html --expect 40
 *   node scripts/map-wrappers.cjs --md wrappers.md --json wrappers.json
 *   node scripts/map-wrappers.cjs --order my-order.txt   (one script path per line)
 *   node scripts/map-wrappers.cjs --all                  (also show functions defined only once)
 *   node scripts/map-wrappers.cjs --list-only            (just print the detected load order)
 *
 * It is a heuristic scanner (no JS parser, no dependencies). See "Limits" in the help text
 * printed with --help.
 */
const fs = require('fs'), path = require('path');
const VALUES = new Set(['html','root','expect','order','md','json']);
const FLAGS = new Set(['help','all','list-only']);
function parseArgs(args) {
  const out = {};
  for (let i=0;i<args.length;i++) {
    const name=args[i].startsWith('--')?args[i].slice(2):'';
    if (FLAGS.has(name)) out[name]=true;
    else if (VALUES.has(name)) {
      if (!args[i+1] || args[i+1].startsWith('--')) throw Error(`--${name} requires a value`);
      out[name]=args[++i];
    } else throw Error(`Unknown argument: ${args[i]}`);
  }
  if (out.expect !== undefined && !/^\d+$/.test(out.expect)) throw Error('--expect must be a non-negative integer (0 disables the count check)');
  return out;
}
let options={}, HTML, ROOT, EXPECT;
const opt=(name,fallback)=>options[name]??fallback;

// Only the actual loader manifest determines this game's execution order.
// Static script tags are a fallback for small fixtures or another HTML entry.
function loadOrder() {
  if (opt('order',false)) return fs.readFileSync(opt('order'),'utf8').split(/\r?\n/).map(s=>s.trim()).filter(s=>s&&!s.startsWith('#'));
  const html=fs.readFileSync(HTML,'utf8').replace(/<!--[\s\S]*?-->/g,''),scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const loader=scripts.find(m=>/\bid\s*=\s*['"]xiantu-v2762-loader['"]/i.test(m[1]));
  if(loader){
    const match=loader[2].match(/\bvar\s+files\s*=\s*(\[[\s\S]*?\])\s*;/);
    if(!match)throw Error('Loader found but its literal var files array is missing');
    const files=JSON.parse(match[1]);
    if(!Array.isArray(files)||files.some(f=>typeof f!=='string'||!f.endsWith('.js')))throw Error('Loader files must be a literal JSON array of .js paths');
    return files;
  }
  return scripts.map(m=>m[1].match(/\bsrc\s*=\s*['"]([^'"]+)['"]/i)?.[1]).filter(Boolean).filter(s=>!/^([a-z]+:)?\/\//i.test(s)).map(s=>s.split(/[?#]/)[0]);
}

// ---------- 2. blank out comments, strings, templates and regex literals ----------
function clean(src) {
  let o = '', i = 0, tail = ''; const n = src.length;
  const keep = c => (c === '\n' || c === '\r') ? c : ' ';
  const push = s => { o += s; const t = s.trim(); if (t) tail = (tail + t).slice(-12); };
  const regexOk = () => !tail || '(,=:[!&|?{};+-*%<>~^'.includes(tail[tail.length - 1]) || /(?:return|typeof|case|do|else|in|of|void|delete|throw|new)$/.test(tail);
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') { o += ' '; i++; } continue; }
    if (c === '/' && d === '*') { while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { o += keep(src[i]); i++; } o += '  '; i += 2; continue; }
    if (c === '"' || c === "'") {
      push(c); i++;
      while (i < n && src[i] !== c && src[i] !== '\n') { if (src[i] === '\\') { o += ' '; i++; } o += keep(src[i]); i++; }
      push(c); i++; continue;
    }
    if (c === '`') {
      push('"'); i++; let depth = 0;
      while (i < n) {
        const ch = src[i];
        if (ch === '\\') { o += '  '; i += 2; continue; }
        if (depth === 0 && ch === '`') { i++; break; }
        if (ch === '$' && src[i + 1] === '{') { depth++; o += '  '; i += 2; continue; }
        if (depth > 0 && ch === '}') { depth--; o += ' '; i++; continue; }
        o += keep(ch); i++;
      }
      push('"'); continue;
    }
    if (c === '/' && regexOk()) {
      push('0'); i++; let cls = false;
      while (i < n && src[i] !== '\n') {
        const ch = src[i];
        if (ch === '\\') { o += '  '; i += 2; continue; }
        if (ch === '[') cls = true; else if (ch === ']') cls = false; else if (ch === '/' && !cls) break;
        o += ' '; i++;
      }
      o += ' '; i++;
      while (/[a-z]/i.test(src[i] || '')) { o += ' '; i++; }
      continue;
    }
    push(c); i++;
  }
  return o;
}

// ---------- 3. scanner ----------
const TOK = /[A-Za-z_$][\w$]*|\d[\w.]*|=>|===|!==|==|!=|<=|>=|&&=|\|\|=|\?\?=|\+=|-=|\*=|\/=|%=|&&|\|\||\?\?|\+\+|--|\.\.\.|[{}()\[\];,.=:?<>+\-*\/%&|^!~]/g;
const CTRL = new Set(['if', 'for', 'while', 'switch', 'with', 'catch', 'return', 'typeof', 'new', 'in', 'of']);
const GLOBAL_ROOTS = new Set(['window', 'globalThis', 'self']);
const isId = t => /^[A-Za-z_$]/.test(t);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function scan(file, order, src, reg, stats) {
  const code = clean(src), T = []; let m;
  const ls = [0]; for (let i = 0; i < src.length; i++) if (src[i] === '\n') ls.push(i + 1);
  const lineOf = p => { let a = 0, b = ls.length - 1; while (a < b) { const mid = (a + b + 1) >> 1; if (ls[mid] <= p) a = mid; else b = mid - 1; } return a + 1; };
  TOK.lastIndex = 0;
  while ((m = TOK.exec(code))) T.push({ t: m[0], p: m.index });
  const mt = new Array(T.length), st = [];
  T.forEach((k, i) => {
    if ('([{'.includes(k.t)) st.push(i);
    else if (')]}'.includes(k.t) && st.length) { const o = st.pop(); mt[o] = i; mt[i] = o; }
  });
  const scopes = [{ fn: true, loc: new Set(), aliases: new Map() }];
  const visibleAliases=()=>{const out=new Map();for(const scope of scopes){for(const name of scope.loc)out.delete(name);for(const [name,target] of scope.aliases)out.set(name,target);}return out;};
  const aliasScope=name=>[...scopes].reverse().find(s=>s.loc.has(name)||s.aliases.has(name))||scopes.at(-1);
  const inFn = () => scopes.some((s, i) => i > 0 && s.fn);
  const isLocal = n => scopes.some((s, i) => i > 0 && s.loc.has(n));
  const fnScope = () => { for (let i = scopes.length - 1; i > 0; i--) if (scopes[i].fn) return scopes[i]; return null; };
  const paramsOf = (o, c) => { const r = []; for (let j = o + 1; j < c; j++) if (isId(T[j].t) && ['(', ',', '...', '{', '['].includes(T[j - 1].t)) r.push(T[j].t); return r; };
  const record = (name, kind, i) => {
    let e = reg.get(name); if (!e) { e = { isFn: false, events: [] }; reg.set(name, e); }
    e.isFn = true; e.events.push({ file, order, line: lineOf(T[i].p), kind });
  };

  for (let i = 0; i < T.length; i++) {
    const k = T[i].t, prev = T[i - 1], p2 = T[i - 2];
    if (k === '{') {
      let fn = false, params = [];
      if (prev && prev.t === '=>') {
        fn = true;
        if (p2 && p2.t === ')') params = paramsOf(mt[i - 2], i - 2); else if (p2 && isId(p2.t)) params = [p2.t];
      } else if (prev && prev.t === ')') {
        const o = mt[i - 1], b = T[o - 1];
        if (b && (b.t === 'function' || (isId(b.t) && !CTRL.has(b.t)))) { fn = true; params = paramsOf(o, i - 1); }
        else if (b && b.t === 'catch') params = paramsOf(o, i - 1);
      }
      scopes.push({ fn, loc: new Set(params), aliases: new Map() }); continue;
    }
    if (k === '}') { if (scopes.length > 1) scopes.pop(); continue; }

    if (k === 'var' || k === 'let' || k === 'const') {
      if (scopes.length>1) {
        const target = k === 'var' ? (fnScope()||scopes[0]) : scopes[scopes.length - 1];
        let j = i + 1, depth = 0;
        while (j < T.length && j < i + 200) {
          const x = T[j].t;
          if ('([{'.includes(x)) depth++; else if (')]}'.includes(x)) { depth--; if (depth < 0) break; }
          if (x === ';' && depth <= 0) break;
          if (isId(x) && !CTRL.has(x) && T[j - 1] && (j === i + 1 || (T[j - 1].t === ',' && depth === 0) || (depth > 0 && ['{', '[', ','].includes(T[j - 1].t) && T[j + 1] && [',', '}', ']', '='].includes(T[j + 1].t)))) target.loc.add(x);
          j++;
        }
      }
      continue;
    }

    if (k === 'function') {
      let j = i + 1; if (T[j] && T[j].t === '*') j++;
      const nm = T[j] && isId(T[j].t) && T[j + 1] && T[j + 1].t === '(' ? T[j].t : null;
      const stmtStart = !prev || [';', '}', '{'].includes(prev.t) || (prev.t === 'async' && (!p2 || [';', '}', '{'].includes(p2.t)));
      if (nm && stmtStart) {
        if (!inFn()) { const had = reg.has(nm) && reg.get(nm).events.length; record(nm, had ? 'overwrite' : 'define', j); }
        else if (fnScope()) fnScope().loc.add(nm);
      }
      continue;
    }

    if (k !== '=') continue;
    // left-hand side path
    let j = i - 1; if (!T[j] || !isId(T[j].t)) continue;
    const parts = [];
    while (true) {
      parts.unshift(T[j].t);
      if (T[j - 1] && T[j - 1].t === '.' && T[j - 2] && isId(T[j - 2].t)) j -= 2; else break;
    }
    if (T[j - 1] && T[j - 1].t === '.') continue;           // foo().bar = ... or a[0].b = ...
    const decl = T[j - 1] && ['var', 'let', 'const'].includes(T[j - 1].t);
    let pp = parts.slice();
    if (!decl && GLOBAL_ROOTS.has(pp[0])) pp = pp.slice(1);
    if (!pp.length || pp[0] === 'this' || pp[0] === 'super') continue;
    const rootLocal = GLOBAL_ROOTS.has(parts[0]) ? isLocal(parts[0]) : isLocal(pp[0]);
    // right-hand side extent
    let e = i + 1, depth = 0;
    for (; e < T.length && e < i + 4000; e++) {
      const x = T[e].t;
      if ('([{'.includes(x)) depth++;
      else if (')]}'.includes(x)) { depth--; if (depth < 0) break; }
      else if (depth === 0 && (x === ';' || x === ',')) break;
      if (depth === 0 && e > i + 1 && lineOf(T[e].p) !== lineOf(T[e - 1].p) && ['}', ')', ']'].includes(T[e - 1].t) && isId(x) && !['in', 'of', 'instanceof'].includes(x)) break;
    }
    const rhs = T.slice(i + 1, e);
    if (!rhs.length) continue;
    // alias capture:  const old = foo;  var _h = window.foo;  const f = foo.bind(x)
    let q = 0, rp = [];
    while (rhs[q] && isId(rhs[q].t)) { rp.push(rhs[q].t); if (rhs[q + 1] && rhs[q + 1].t === '.' && rhs[q + 2] && isId(rhs[q + 2].t)) q += 2; else { q++; break; } }
    if (rp.length && GLOBAL_ROOTS.has(rp[0])) rp = rp.slice(1);
    const after = rhs[q];
    const bareRef = rp.length && !['function', 'async', 'new', 'typeof', 'this'].includes(rp[0]) && !isLocal(rp[0]) &&
      (!after || ['||', '&&', '?'].includes(after.t) || (after.t === '.' && rhs[q + 1] && rhs[q + 1].t === 'bind'));
    if (parts.length === 1 && bareRef && !(rp.length === 1 && rp[0] === pp[0])) { aliasScope(parts[0]).aliases.set(parts[0], rp.join('.')); continue; }
    if(parts.length===1)aliasScope(parts[0]).aliases.delete(parts[0]);
    if (rootLocal || (decl && inFn())) continue;
    const pathStr = pp.join('.');
    // classify RHS
    const f0 = rhs[0].t;
    let isFnLit = f0 === 'function' || (f0 === 'async' && rhs[1] && rhs[1].t === 'function');
    if (!isFnLit) {
      let s = f0 === 'async' ? 1 : 0; const a = rhs[s];
      if (a && a.t === '(' && mt[i + 1 + s] !== undefined && T[mt[i + 1 + s] + 1] && T[mt[i + 1 + s] + 1].t === '=>') isFnLit = true;
      else if (a && isId(a.t) && rhs[s + 1] && rhs[s + 1].t === '=>') isFnLit = true;
    }
    const names = [...visibleAliases()].filter(([, tg]) => tg === pathStr).map(([n]) => n);
    const usesAlias = names.length && rhs.some((x, n) => names.includes(x.t) && rhs[n + 1] && ['(', '.', '?'].includes(rhs[n + 1].t));
    const joined = ' ' + rhs.map(x => x.t).join(' ').replace(/\b(?:window|globalThis|self) \. /g, '').replace(/ \. /g, '.') + ' ';
    const selfRef = !isFnLit && new RegExp('[ (,]' + esc(pathStr) + '[ ),.]').test(joined);
    const known = reg.get(pathStr);
    let kind = null;
    if (names.length && (isFnLit || known?.isFn)) kind = usesAlias ? 'wrap' : 'wrap?';
    else if (selfRef && known && known.isFn) kind = 'wrap-decorator';
    else if (isFnLit || (known && known.isFn)) kind = known && known.events.length ? 'overwrite' : 'define';
    if (kind) record(pathStr, kind, i);
  }
  stats.files.set(file, { tokens: T.length });
}

// ---------- 4. run ----------
function main() {
  options=parseArgs(process.argv.slice(2));
  if(opt('help',false)) {
    console.log('Usage: node scripts/map-wrappers.cjs [--html path] [--root path] [--expect count]\n  [--order path] [--all] [--list-only] [--md path] [--json path]\n\nStatic heuristic audit, not execution tracing or proof of a defect.\nDefault: game-v2762.html loader manifest, 40 scripts. --expect 0 disables count checking.\nExplicit order paths are relative to --root (default: the HTML directory).\nLimits: bracket properties, object-literal patches, defineProperty, eval, template\nexpressions, complex scope/hoisting, multi-hop aliases and dynamic names may be missed.\nFunction bodies are scanned regardless of whether their code executes.');
    return;
  }
  HTML=path.resolve(opt('html','xiantu-v2831-scroll/game-v2762.html'));
  ROOT=path.resolve(opt('root',path.dirname(HTML)));EXPECT=Number(opt('expect',40));
  const order = loadOrder();
  if(!order.length)throw Error('No local scripts found');
  if(new Set(order).size!==order.length)throw Error('Duplicate script paths in load order');
  if(EXPECT && order.length!==EXPECT)throw Error(`Found ${order.length} scripts, expected ${EXPECT}; use --expect 0 for a different project`);
  const missing=order.filter(f=>!fs.existsSync(path.resolve(ROOT,f)));
  if(missing.length)throw Error('Missing scripts: '+missing.join(', '));
  for(const output of [opt('md',null),opt('json',null)].filter(Boolean)){
    const dest=path.resolve(output),sources=[__filename,HTML,...order.map(f=>path.resolve(ROOT,f)),...(opt('order',false)?[path.resolve(opt('order'))]:[])];
    if(sources.includes(dest))throw Error('Output must not overwrite an input file: '+output);
  }
  if(opt('md',null)&&opt('json',null)&&path.resolve(opt('md'))===path.resolve(opt('json')))throw Error('--md and --json must use different paths');
  if (opt('list-only', false)) { order.forEach((f, i) => console.log(String(i + 1).padStart(2, '0') + '  ' + f)); return; }
  const reg = new Map(), stats = { files: new Map() };
  order.forEach((f, idx) => {
    const fp = path.resolve(ROOT, f);
    scan(f, idx + 1, fs.readFileSync(fp, 'utf8'), reg, stats);
  });
  const showAll = opt('all', false);
  const rows = [...reg].filter(([, v]) => showAll || v.events.some(e => e.kind !== 'define'))
    .sort((a, b) => b[1].events.length - a[1].events.length || a[0].localeCompare(b[0]));
  const flag = (events, i) => {
    const e = events[i], earlier = events.slice(0, i).filter(x => x.kind !== 'define' && x.kind !== 'overwrite').length;
    if (e.kind === 'overwrite' && earlier) return `possible replacement after ${earlier} wrapper candidate(s)`;
    if (e.kind === 'overwrite') return 'replaces earlier definition';
    if (e.kind === 'wrap?') return 'prior-function alias visible; no direct alias call detected';
    return '';
  };
  const count = k => rows.reduce((n, [, v]) => n + v.events.filter(e => e.kind === k).length, 0);
  const lines = [];
  lines.push(`Scripts scanned: ${order.length - missing.length}   Functions tracked: ${reg.size}   Functions shown: ${rows.length}`);
  lines.push(`wrap: ${count('wrap')}   wrap-decorator: ${count('wrap-decorator')}   wrap? (needs review): ${count('wrap?')}   overwrite: ${count('overwrite')}`);
  if (missing.length) lines.push('MISSING FILES: ' + missing.join(', '));
  lines.push('Advisory static scan: conditional and deferred writes are not runtime execution order.');
  lines.push('Limits: bracket properties, object patches, template expressions, complex scopes and indirect aliases may be missed.');
  lines.push('');
  const risky = rows.filter(([, v]) => v.events.some((_, i) => /possible replacement|no direct alias call/.test(flag(v.events, i))));
  if (risky.length) { lines.push(`REVIEW CANDIDATES (${risky.length}): verify control flow and delegation manually`); risky.forEach(([n]) => lines.push('  ' + n)); lines.push(''); }
  rows.forEach(([n, v]) => {
    lines.push(`${n}  (${v.events.length} layer${v.events.length > 1 ? 's' : ''})`);
    v.events.forEach((e, i) => lines.push(`  #${String(e.order).padStart(2, '0')} ${e.file}:${e.line}`.padEnd(72) + ' ' + e.kind.toUpperCase().padEnd(16) + flag(v.events, i)));
    lines.push('');
  });
  const perFile = new Map();
  rows.forEach(([, v]) => v.events.filter(e => e.kind !== 'define').forEach(e => perFile.set(e.file, (perFile.get(e.file) || 0) + 1)));
  lines.push('Files that patch the most (wraps + overwrites):');
  [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([f, c]) => lines.push(`  ${String(c).padStart(4)}  ${f}`));
  console.log(lines.join('\n'));
  if (typeof opt('md', false) === 'string') {fs.mkdirSync(path.dirname(path.resolve(opt('md'))),{recursive:true});fs.writeFileSync(opt('md'), '```\n' + lines.join('\n') + '\n```\n');}
  if (typeof opt('json', false) === 'string') {fs.mkdirSync(path.dirname(path.resolve(opt('json'))),{recursive:true});fs.writeFileSync(opt('json'), JSON.stringify(Object.fromEntries(rows.map(([n, v]) => [n, v.events])), null, 2)+'\n');}
}
try { main(); } catch(error) { console.error('wrapper audit: '+error.message); process.exitCode=1; }
