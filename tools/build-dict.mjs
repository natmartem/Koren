// Koren · builds koren-dict.json, the Russian–English dictionary behind tap-a-word in song and poem texts.
// SPDX-License-Identifier: AGPL-3.0-or-later (this script) · the data is OpenRussian.org, CC BY-SA 4.0 (see DICT-LICENSE.md)
//
// Run: git clone --depth 1 https://github.com/Badestrand/russian-dictionary /tmp/ord
//      node tools/build-dict.mjs /tmp/ord
//
// Each file in OpenRussian's export is sorted by frequency, so the top of each file is kept. Every entry is
// [stressed word, English, kind, forms]: forms are the inflected forms in a fixed order per kind (the app
// labels them), with stress marks as combining accents. The app builds a form → entry index when the file
// first loads, only on song and poem pages.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) { console.error("usage: node tools/build-dict.mjs <folder with nouns.csv, verbs.csv, adjectives.csv, others.csv>"); process.exit(1); }
const KEEP = { nouns: 7000, verbs: 3500, adjectives: 3000, others: 5000 };
const acc = s => (s || "").replace(/\*/g, "").replace(/'/g, "́").replace(/ё́/g, "ё").trim();
const en = s => {
  const parts = (s || "").split(/[;,]\s*/).map(x => x.trim()).filter(Boolean);
  let out = "";
  for (const p of parts) { if ((out + ", " + p).length > 48 && out) break; out = out ? out + ", " + p : p; }
  return out;
};
const read = f => {
  const [head, ...rows] = readFileSync(join(src, f + ".csv"), "utf8").split("\n").filter(Boolean);
  const cols = head.split("\t");
  return rows.map(r => { const v = r.split("\t"), o = {}; cols.forEach((c, i) => o[c] = v[i] || ""); return o; });
};
// forms in a fixed order per kind; several forms in one cell are separated by ", "
const FORMS = {
  n: ["sg_nom", "sg_gen", "sg_dat", "sg_acc", "sg_inst", "sg_prep", "pl_nom", "pl_gen", "pl_dat", "pl_acc", "pl_inst", "pl_prep"],
  v: ["presfut_sg1", "presfut_sg2", "presfut_sg3", "presfut_pl1", "presfut_pl2", "presfut_pl3", "past_m", "past_f", "past_n", "past_pl", "imperative_sg", "imperative_pl"],
  a: ["decl_m_nom", "decl_m_gen", "decl_m_dat", "decl_m_acc", "decl_m_inst", "decl_m_prep", "decl_f_nom", "decl_f_gen", "decl_f_dat", "decl_f_acc", "decl_f_inst", "decl_f_prep",
      "decl_n_nom", "decl_n_gen", "decl_n_dat", "decl_n_acc", "decl_n_inst", "decl_n_prep", "decl_pl_nom", "decl_pl_gen", "decl_pl_dat", "decl_pl_acc", "decl_pl_inst", "decl_pl_prep",
      "short_m", "short_f", "short_n", "short_pl", "comparative"]
};
const out = [];
const add = (file, kind, extra) => read(file).slice(0, KEEP[file]).forEach(r => {
  if (!r.bare || !r.translations_en) return;
  const forms = (FORMS[kind] || []).map(c => acc(r[c]).split(/,\s*/)[0] || "").map(f => f === acc(r.accented) ? "=" : f);
  while (forms.length && !forms[forms.length - 1]) forms.pop();
  out.push([acc(r.accented) || r.bare, en(r.translations_en), kind + (extra ? extra(r) : ""), forms.join("|")]);
});
add("others", "o");
add("nouns", "n", r => r.pl_only === "1" ? "p" : "");
add("verbs", "v", r => r.aspect === "perfective" ? "f" : "");
add("adjectives", "a");
const json = JSON.stringify({ about: "Russian–English dictionary for Koren, from OpenRussian.org (CC BY-SA 4.0, https://en.openrussian.org). Kinds: o other, n noun (np plural only), v verb (vf perfective), a adjective. Forms: = means the same as the headword.", entries: out });
writeFileSync(new URL("../koren-dict.json", import.meta.url), json);
console.log(`koren-dict.json: ${out.length} entries, ${(json.length / 1024 / 1024).toFixed(2)} MB`);
