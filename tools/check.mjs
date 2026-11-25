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
const keys = new Map();

for (const [kind, list] of [["word", C.words], ["phrase", C.phrases]]) {
  list.forEach((w, i) => {
    const where = `${kind} ${i + 1} (${w[0]})`;
    if (w.length !== 5) err(where, "should have 5 fields");
    if (!topics.has(w[3])) err(where, `unknown topic “${w[3]}”`);
    for (const p of (w[4] || "").split(/\s+/).filter(Boolean)) if (!prins.has(p)) err(where, `unknown principle “${p}”`);
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
  const seen = new Set();
  (p.items || []).forEach((x, i) => {
    const w = `${where} item ${i + 1}`;
    if (p.drill === "form") {
      if (x.length !== 8) err(w, "form items need 8 fields");
      if (!x[0].includes("…")) err(w, "frame needs …");
      checkStress(x[0], w); checkStress(x[2], w); if (x[1]) checkStress(x[1], w);
      const opts = [x[2], x[3], x[4], x[5]];
      if (new Set(opts).size !== 4) err(w, "the four answers must all differ");
    } else if (p.drill === "stress") {
      checkStress(x[0], w);
      if ((plain(x[0]).match(VOW) || []).length < 2 || /ё/.test(x[0])) err(w, "stress items need 2+ vowels and no ё");
    } else {
      if (x.length !== 3) err(w, "items need 3 fields");
      if (p.drill !== "read") checkStress(x[0], w);
      if (seen.has(x[0])) err(w, "duplicate"); seen.add(x[0]);
    }
  });
}

for (const r of C.readings || []) {
  if (!topics.has(r.topic)) err(`reading ${r.id}`, `unknown topic “${r.topic}”`);
  r.lines.forEach((l, i) => { checkStress(l[0], `reading ${r.id} line ${i + 1}`); if (l.length !== 3) err(`reading ${r.id} line ${i + 1}`, "needs Russian, English, Arabic"); });
}

if (errors.length) { console.error(errors.join("\n")); console.error(`\n${errors.length} problem(s).`); process.exit(1); }
console.log(`OK · ${C.topics.length} topics · ${C.principles.length} principles · ${C.words.length} words · ${C.phrases.length} phrases · ${C.readings.length} readings`);
