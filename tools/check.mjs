// Koren · content checks. Run: node tools/check.mjs   (also runs on GitHub for every push)
// SPDX-License-Identifier: AGPL-3.0-or-later
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
vm.runInNewContext(readFileSync(new URL("../course.js", import.meta.url), "utf8"), ctx);
const C = ctx.window.COURSE;
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const VOW = /[аеиоуыэюяё]/gi;
const plain = s => s.replace(/́/g, "");
// Every word of two or more vowels needs exactly one stress mark (ё counts as stressed).
function checkStress(text, where) {
  for (const tok of text.split(/[\s.,!?«»"“”:;()…→]+/).filter(t => !/^-|-$/.test(t)).flatMap(t => t.split(/[-—–]/))) {
    if (!tok || /^[А-ЯЁ]{2,}$/.test(plain(tok))) continue; // signs in capitals
    const n = (plain(tok).match(VOW) || []).length, marks = (tok.match(/́/g) || []).length;
    if (marks > 1) err(where, `“${tok}” has ${marks} stress marks`);
    if (n >= 2 && marks === 0 && !/ё/i.test(tok)) err(where, `“${tok}” needs a stress mark`);
    if (/[^аеиоуыэюяАЕИОУЫЭЮЯ]́/.test(tok)) err(where, `“${tok}”: stress mark not after a vowel`);
  }
}

const topics = new Set(C.topics.map(t => t.id));
const prins = new Set(C.principles.map(p => p.id));
const partsOf = new Map(C.principles.map(p => [p.id, new Set((p.parts || []).map(x => x.id))]));
const validTag = t => { const [pid, part] = t.split(":"); return prins.has(pid) && (!part || partsOf.get(pid).has(part)); };
const keys = new Map();

for (const [kind, list] of [["word", C.words], ["phrase", C.phrases]]) {
  list.forEach((w, i) => {
    const where = `${kind} ${i + 1} (${w[0]})`;
    if (w.length !== 5) err(where, "should have 5 fields");
    if (!topics.has(w[3])) err(where, `unknown topic “${w[3]}”`);
    for (const p of (w[4] || "").split(/\s+/).filter(Boolean)) if (!validTag(p)) err(where, `unknown principle or part “${p}”`);
    if (!w[1] || !w[2]) err(where, "missing English or Arabic");
    checkStress(w[0], where);
    const key = (kind === "word" ? "W:" + plain(w[0]).toLowerCase() : "P:" + plain(w[0]));
    if (keys.has(key)) err(where, `duplicate of ${keys.get(key)}`); else keys.set(key, where);
  });
}

for (const p of C.principles) {
  const where = `principle ${p.id}`;
  for (const f of ["en", "ar"]) if (!p[f] || !p.body?.[f] || !p.can?.[f]) err(where, `missing ${f} title, can-do or body`);
  for (const f of ["en", "ar"]) {
    const b = p.body?.[f] || "";
    for (const m of b.matchAll(/\{([^}]+)\}/g)) checkStress(m[1], `${where} body ${f}`);
    if ((b.match(/<ar>/g) || []).length !== (b.match(/<\/ar>/g) || []).length) err(where, `unbalanced <ar> in ${f} body`);
    const br = p.bridge?.[f] || "";
    if ((br.match(/<ar>/g) || []).length !== (br.match(/<\/ar>/g) || []).length) err(where, `unbalanced <ar> in ${f} bridge`);
  }
  (p.ex || []).forEach(x => checkStress(x[0], `${where} example`));
  (p.parts || []).forEach(pt => { for (const f of ["en", "ar"]) { if (!pt[f] || !pt.body?.[f]) err(`${where} part ${pt.id}`, `missing ${f}`);
    for (const m of (pt.body?.[f] || "").matchAll(/\{([^}]+)\}/g)) checkStress(m[1], `${where} part ${pt.id} ${f}`); } });
  const seen = new Set();
  (p.items || []).forEach((x, i) => {
    const w = `${where} item ${i + 1}`;
    if (p.drill === "form") {
      if (x.length !== 8 && x.length !== 9) err(w, "form items need 8 fields (9 with a part)");
      if (x.length === 9 && !partsOf.get(p.id).has(x[8])) err(w, `unknown part “${x[8]}”`);
      if (!x[0].includes("…")) err(w, "frame needs …");
      checkStress(x[0], w); checkStress(x[2], w); if (x[1]) checkStress(x[1], w);
      const opts = [x[2], x[3], x[4], x[5]];
      if (new Set(opts).size !== 4) err(w, "the four answers must all differ");
    } else if (p.drill === "stress") {
      checkStress(x[0], w);
      if ((plain(x[0]).match(VOW) || []).length < 2 || /ё/.test(x[0])) err(w, "stress items need 2+ vowels and no ё");
    } else {
      if (x.length < 3 || x.length > 5) err(w, "items need 3 fields (4 with a root, 5 with a part)");
      if (x.length === 5 && !partsOf.get(p.id).has(x[4])) err(w, `unknown part “${x[4]}”`);
      if (p.drill !== "read") checkStress(x[0], w);
      if (seen.has(x[0])) err(w, "duplicate"); seen.add(x[0]);
    }
  });
}

// path
const stepIds = new Set([...C.topics.map(t => "t:" + t.id), ...C.readings.map(r => "r:" + r.id),
  ...C.principles.flatMap(p => ["p:" + p.id, ...(p.parts || []).map(x => `p:${p.id}:${x.id}`)])]);
(C.path || []).forEach(st => { if (!stepIds.has(st)) err("path", `unknown step “${st}”`); });
const songTopics = new Set(C.topics.filter(t => t.song).map(t => "t:" + t.id)); // song words are taught in the Songs tab, not on the path
[...stepIds].forEach(st => { if (C.path && !C.path.includes(st) && !songTopics.has(st)) err("path", `“${st}” is not on the path`); });
songTopics.forEach(st => { if ((C.path || []).includes(st)) err("path", `${st} is a song topic: keep it off the path`); });
C.principles.forEach(p => (p.parts || []).forEach(pt => { if (C.path && C.path.indexOf(`p:${p.id}:${pt.id}`) < C.path.indexOf("p:" + p.id)) err("path", `part ${p.id}:${pt.id} comes before its card`); }));

// songs
const wordKeys = new Map(C.words.map(w => [plain(w[0]).toLowerCase(), w])), phraseKeys = new Set(C.phrases.map(p => plain(p[0])));
const songIds = new Set();
(C.songs || []).forEach((sg, i) => {
  const where = `song ${sg.id || i + 1}`;
  if (!sg.id || songIds.has(sg.id)) err(where, "needs a unique id"); songIds.add(sg.id);
  for (const f of ["ru", "by", "en", "ar"]) if (!sg[f]) err(where, `missing ${f}`);
  checkStress(sg.ru, where);
  if (sg.video && !/^[\w-]{11}$/.test(sg.video)) err(where, "video must be a YouTube id (11 characters)");
  if (sg.lyrics && !/^https:\/\//.test(sg.lyrics)) err(where, "lyrics must be an https link to a licensed lyrics page");
  (sg.ps || []).forEach(t => { if (!validTag(t)) err(where, `unknown principle or part “${t}”`); });
  const checkBody = (o, w2) => { for (const f of ["en", "ar"]) { const b = o?.[f] || "";
    for (const m of b.matchAll(/\{([^}]+)\}/g)) checkStress(m[1], `${w2} ${f}`);
    if ((b.match(/<ar>/g) || []).length !== (b.match(/<\/ar>/g) || []).length) err(w2, `unbalanced <ar> in ${f}`); } };
  (sg.notes || []).forEach(n => { if (!n.en || !n.ar || !n.body?.en || !n.body?.ar) err(`${where} note ${n.id}`, "needs en, ar and body"); checkBody(n.body, `${where} note ${n.id}`); });
  if (!(sg.lessons || []).length) err(where, "needs at least one lesson");
  (sg.lessons || []).forEach((l, j) => {
    const w2 = `${where} lesson ${j + 1}`;
    if (!l.en || !l.ar || !l.body?.en || !l.body?.ar) err(w2, "needs en, ar and body");
    checkBody(l.body, w2); if (l.bridge) checkBody(l.bridge, `${w2} bridge`);
    if (!(l.words || []).length) err(w2, "needs words");
    (l.words || []).forEach(w => { if (!wordKeys.has(plain(w).toLowerCase())) err(w2, `“${w}” is not in words`); });
    (l.phrases || []).forEach(ph => { if (!phraseKeys.has(plain(ph))) err(w2, `“${ph}” is not in phrases`); });
  });
});

// combination tables
(C.nouns || []).forEach((n, i) => {
  const w = `noun ${i + 1} (${n[0]})`;
  if (n.length !== 10) err(w, "needs 10 fields");
  if (!["m", "f", "n", "pl"].includes(n[3])) err(w, `gender “${n[3]}”`);
  if (!"PLCTFVWBMD".includes(n[4]) || n[4].length !== 1) err(w, `kind “${n[4]}”`);
  if (n[5] && !/^(в|во|на) /.test(n[5])) err(w, "where must start with в, во or на");
  [0, 5, 6, 7, 8, 9].forEach(k => n[k] && checkStress(n[k], w));
});
(C.adjs || []).forEach((a, i) => { if (a.length !== 7) err(`adjective ${i + 1}`, "needs 7 fields"); a.slice(0, 4).forEach(f => checkStress(f, `adjective ${a[0]}`)); });
(C.verbs || []).forEach((v, i) => {
  if (v.length !== 10) err(`verb ${i + 1} (${v[0]})`, "needs 10 fields");
  v.slice(0, 1).concat(v.slice(3, 9)).forEach(f => checkStress(f, `verb ${v[0]}`));
  v[9].split("|").forEach(c => checkStress(c, `verb ${v[0]} sentence ending`));
});

for (const r of C.readings || []) {
  if (!topics.has(r.topic)) err(`reading ${r.id}`, `unknown topic “${r.topic}”`);
  r.lines.forEach((l, i) => { checkStress(l[0], `reading ${r.id} line ${i + 1}`); if (l.length !== 3) err(`reading ${r.id} line ${i + 1}`, "needs Russian, English, Arabic"); });
}

// words used in readings and phrases that the course doesn't teach (warning only)
const taught = new Set();
const addT = w => w && taught.add(plain(w).toLowerCase());
C.words.forEach(w => plain(w[0]).split(/\s+/).forEach(addT));
(C.nouns || []).forEach(n => [n[0], n[6], n[7], n[8], n[9], n[5] && n[5].split(" ").slice(1).join(" ")].forEach(addT));
(C.adjs || []).forEach(a => a.slice(0, 4).forEach(addT));
(C.verbs || []).forEach(v => [v[0], ...v.slice(3, 9)].forEach(addT));
C.principles.forEach(p => (p.items || []).forEach(x => (p.drill === "form" ? [x[0], x[2]] : [x[0]]).forEach(t => plain(t).split(/[\s.,!?…]+/).forEach(addT))));
["мой","моя","моё","мои","твой","твоя","твоё","твои","этот","эта","это","эти","его","её","их","меня","тебя","нас","вас","мне","тебе","ему","ей","нам","вам","им","у","в","во","на","не","с","к","по","до","что","нет"].forEach(addT);
const unknown = new Map();
const scan = (t, where) => plain(t).split(/[\s.,!?«»"“”:;…—–]+/).filter(Boolean).forEach(tok => { const k = tok.toLowerCase(); if (!taught.has(k) && !/^[А-ЯЁA-Z]/.test(tok)) unknown.set(k, where); });
(C.readings || []).forEach(r => r.lines.forEach(l => scan(l[0], `reading ${r.id}`)));
C.phrases.forEach(p => scan(p[0], "phrase"));
if (unknown.size && process.argv.includes("--words")) console.log("Not yet taught as a word or form:\n" + [...unknown].map(([k, w]) => `  ${k}  (${w})`).join("\n"));

if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK · ${C.topics.length} topics · ${C.principles.length} principles · ${C.words.length} words · ${C.phrases.length} phrases · ${C.readings.length} readings · ${(C.songs || []).length} songs`);
