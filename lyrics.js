/* Koren · Copyright © 2026 natmartem · SPDX-License-Identifier: AGPL-3.0-or-later */
/* Lyrics parser, shared by the app (index.html) and the recorder (record.html), so a song line the speaker
   records has exactly the same text, and so the same audio key, as the line the learner sees. Keep it in one place. */
"use strict";
/* ---- lyrics: pasted by the learner, any common format ----
   Accepted: Russian only; "Russian | translation" or tab-separated; Russian and translation on alternating lines;
   all Russian then all translation; LyricsTranslate's side-by-side copy ("…головеTo live…").
   Section labels like [Припев] are kept; bits that lyrics sites add (links, "You might also like", "Embed") are dropped. */
const CYR=/[А-Яа-яЁё]/,OTHER=/[A-Za-z؀-ۿ]/;
const LYRHEAD=/^(припев|куплет|бридж|аутро|интро|chorus|verse|bridge|outro|intro|pre-chorus)[\s\d:.]*$/i;
function lyrJunk(l){
  return /\]\(https?:/i.test(l)||/^you might also like$/i.test(l)||/^\d*\s*contributors?\b/i.test(l)||/\d*\s*embed$/i.test(l)&&!CYR.test(l)
   ||/\blyrics$/i.test(l)||/^(translations?|english|русский|українська|español|deutsch|français|العربية|read more|see .* live|get tickets.*)$/i.test(l)
   ||/^(submitted by|last edited by|thanks!|thanks? \d|source:|translation:|\d+ thanks? received|\d+ times? favorited)/i.test(l)||/^\[?текст песни/i.test(l);
}
function lyrRaw(text){
  return String(text||"").replace(/\r/g,"").replace(/ /g," ")
    .replace(/([^\n\s])\[(?=[^\]\n]{1,40}\])/g,"$1\n[").replace(/\](?=[^\s\n(\]])/g,"]\n") /* "…Lyrics[Куплет 1]Жить…" → separate lines */
    .split("\n").map(l=>l.replace(/[ \u00a0]+/g," ").replace(/^[ \t]+|[ \t]+$/g,""));
}
function lyrParse(text){
  const raw=lyrRaw(text).filter(l=>!l||!lyrJunk(l)),out=[];
  const isHead=l=>/^\[[^\]]*\]$/.test(l)||LYRHEAD.test(l);
  const content=raw.filter(l=>l&&!isHead(l));
  const C=content.filter(l=>CYR.test(l)),N=content.filter(l=>!CYR.test(l)&&OTHER.test(l));
  const RUN=/^([^A-Za-z؀-ۿ]*[А-Яа-яЁё][^A-Za-z؀-ۿ]*?)\s*([A-Z؀-ۿ].*)$/;
  let mode="ru";
  if(content.some(l=>/\||\t/.test(l)))mode="sep";
  else if(C.length&&C.filter(l=>RUN.test(l)).length>=C.length*.6)mode="run";
  else if(C.length>=2&&N.length>=C.length*.7){
    let alt=0;for(let i=0;i+1<content.length;i++)if(CYR.test(content[i])&&!CYR.test(content[i+1]))alt++;
    mode=alt>=C.length*.7?"alt":"blocks";
  }
  const push=(ru,tr)=>{ru=ru.trim();if(ru)out.push({ru,tr:(tr||"").trim()})};
  const gap=()=>{if(out.length&&!out[out.length-1].gap)out.push({gap:1})};
  if(mode==="blocks"){ /* all Russian first, then all translation: pair them by position */
    let k=0;raw.forEach(l=>{if(!l)return gap();if(isHead(l)){if(CYR.test(l)||!out.some(x=>x.ru))out.push({head:l.replace(/^\[|\]$/g,"")});return}if(CYR.test(l))push(l,N[k++]||"")});
  }else{
    for(let i=0;i<raw.length;i++){const l=raw[i];
      if(!l){gap();continue}
      if(isHead(l)){out.push({head:l.replace(/^\[|\]$/g,"")});continue}
      if(mode==="sep"){const m=l.split(/\s*\|\s*|\t+/);if(CYR.test(m[0])||m.length===1)push(m[0],m.slice(1).join(" "));continue}
      if(mode==="run"){const m=RUN.exec(l);if(m)push(m[1],m[2]);else if(CYR.test(l))push(l);continue}
      if(mode==="alt"){if(CYR.test(l)){const nx=raw[i+1];if(nx&&!CYR.test(nx)&&OTHER.test(nx)&&!isHead(nx)){push(l,nx);i++}else push(l)}continue}
      if(CYR.test(l))push(l); /* Russian only: lines without Russian are dropped */
    }
  }
  while(out.length&&(out[0].gap))out.shift();
  while(out.length&&(out[out.length-1].gap||out[out.length-1].head))out.pop();
  return out;
}
