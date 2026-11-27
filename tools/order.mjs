// Koren · path order check. Run: node tools/order.mjs [--all]   (check.mjs runs it too)
// SPDX-License-Identifier: AGPL-3.0-or-later
// Loads the app itself, walks the path in order as a learner would, and reports anything that would be
// shown before it is taught: phrases, readings below 95% known words, principle steps without enough drills
// built only from known words and explained endings, and words the course doesn't know at all.
import { readFileSync } from "node:fs";
import vm from "node:vm";

export function loadApp(gender = "f") {
  const root = new URL("../", import.meta.url);
  const html = readFileSync(new URL("index.html", root), "utf8");
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1])[0];
  const fake = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : fake(), set: () => true, apply: () => fake() });
  const store = { "koren-state": JSON.stringify({ gender }) };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    document: { querySelector: () => fake(), querySelectorAll: () => [], addEventListener() {}, documentElement: fake(), createElement: () => fake(), body: fake() },
    navigator: {}, location: { hash: "#path", protocol: "file:" }, URL: { createObjectURL: () => "blob:x" }, Blob: class {}, File: class {},
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, fetch: () => Promise.reject(new Error("offline")), alert() {}, history: { replaceState() {} },
    Float32Array, Int16Array, Uint8Array, ArrayBuffer, DataView, Promise, Map, Set, JSON, Math, Date, Object, Array, String, Number, RegExp, Symbol, Error
  };
  ctx.window = ctx; ctx.addEventListener = () => {};
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("course.js", root), "utf8"), ctx);
  try { vm.runInContext(script, ctx, { filename: "index.html" }); } catch (e) { /* UI code may fail without a page; the course logic is built first */ }
  return code => vm.runInContext(code, ctx);
}

export function walkPath(run) {
  return run(`(()=>{
  const W=new Set(),P=new Set();
  const base={w:k=>k.startsWith("C:")?P.has(k.slice(2)):W.has(k),p:t=>P.has(t)};
  const with_=(ws,tags)=>{const w=new Set(ws),p=new Set();tags.forEach(t=>{p.add(t);p.add(t.split(":")[0])});
    return {w:k=>w.has(k)||(k.startsWith("C:")&&p.has(k.slice(2)))||base.w(k),p:t=>p.has(t)||base.p(t)}};
  const inLex=t=>{const n=tn(t);return FWD.has(n)||FWT.has(n)||FREE.has(n)};
  const R={errors:[],warnings:[],names:new Set(),steps:[]};
  const where=(si,st)=>"path step "+(si+1)+" "+st.id;
  const unknownWords=(text,w)=>tk(text).forEach(t=>{if(inLex(t))return;if(/^[А-ЯЁ]/.test(t))R.names.add(t);else R.errors.push(w+": “"+t+"” is not in the words, the tables or a card")});
  STEPS.forEach((st,si)=>{
    const w=where(si,st);
    const tag=st.k==="p"?st.pid+(st.part?":"+st.part:""):"";
    const K=with_([...(st.words||[]),...st.phrases].map(x=>x.key),tag?[tag]:[]);
    let info={id:st.id};
    if(st.k==="p"){
      const p=PRm[st.pid];let pool=p.list.filter(x=>(x.part||"")===(st.part||""));if(!pool.length)pool=p.list;
      pool=pool.filter(x=>!songLocked(x));
      const ok=pool.filter(x=>itemFits(x,K));
      const bases=new Set(ok.map(x=>x.base||x.full||x.ru));
      const opts=ok.filter(x=>p.drill!=="form"||(x.cands||x.wrong).filter(o=>fits(x.frame.replace("…",o),K)).length>=1);
      info.items=pool.length;info.fit=ok.length;info.bases=bases.size;info.withOptions=opts.length;
      const need=Math.min(8,pool.length);
      if(ok.length<need)R.errors.push(w+": only "+ok.length+" of "+pool.length+" drills use known words and explained endings (needs "+need+")"+(pool.length?" · e.g. “"+itemText(pool.find(x=>!itemFits(x,K))||pool[0])+"” needs "+unknownToks(itemText(pool.find(x=>!itemFits(x,K))||pool[0]),K).join(", "):""));
      else if(bases.size<Math.min(4,ok.length))R.warnings.push(w+": its "+ok.length+" drills are built on only "+bases.size+" word(s)");
      pool.filter(x=>!x.gen).forEach(x=>unknownWords(itemText(x),w+" drill"));
    }
    if(st.k==="r"){
      const r=READS.find(y=>y.id===st.rid);const toks=r.lines.flatMap(l=>tk(l[0]));
      const bad=r.lines.flatMap(l=>unknownToks(l[0],K));const cover=toks.length?1-bad.length/toks.length:1;
      info.cover=Math.round(cover*1000)/10;info.unknown=[...new Set(bad)];
      r.lines.forEach(l=>unknownWords(l[0],w+" reading"));
      if(cover<.95)R.errors.push(w+": "+info.cover+"% of its words are known at this point (needs 95%) · not yet known: "+info.unknown.join(", "));
    }
    st.phrases.forEach(ph=>{unknownWords(ph.ru,w+" phrase");const u=unknownToks(ph.ru,with_([...(st.words||[]),...st.phrases].map(x=>x.key),tag?[tag]:[]));
      if(u.length)R.errors.push(w+": phrase “"+ph.ru+"” uses "+u.join(", ")+" before it is taught")});
    R.steps.push(info);
    (st.words||[]).forEach(x=>W.add(x.key));st.phrases.forEach(x=>W.add(x.key));if(tag){P.add(tag);P.add(st.pid)}
  });
  /* at the end of the path: drills that can never be shown, and wrong options that are never usable */
  let never=0,neverEx=[];
  PR.forEach(p=>p.list.forEach(x=>{if(songLocked(x))return;if(!itemFits(x,base)){never++;if(neverEx.length<12)neverEx.push(p.id+": “"+itemText(x)+"” needs "+unknownToks(itemText(x),base).join(", "))}}));
  if(never)R.warnings.push(never+" drill(s) can't be shown even at the end of the path, e.g.\\n    "+neverEx.join("\\n    "));
  READS.forEach(r=>{if(!STEPS.some(s=>s.rid===r.id))R.warnings.push("reading "+r.id+" is not on the path")});
  R.names=[...R.names];
  return JSON.parse(JSON.stringify(R));
  })()`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const R = walkPath(loadApp("f"));
  const all = process.argv.includes("--all");
  if (all) R.steps.forEach((s, i) => console.log(String(i + 1).padStart(3), s.id.padEnd(22), s.items != null ? `drills ${s.fit}/${s.items} on ${s.bases} words` : s.cover != null ? `known ${s.cover}%${s.unknown.length ? " · new: " + s.unknown.join(", ") : ""}` : ""));
  if (R.names.length) console.log("Treated as names:", R.names.join(", "));
  R.warnings.forEach(w => console.log("warning · " + w));
  R.errors.forEach(e => console.log("ERROR · " + e));
  console.log(`\n${R.errors.length} error(s), ${R.warnings.length} warning(s).`);
  process.exit(R.errors.length ? 1 : 0);
}
