# Koren · Корень

A small installable web app for learning Russian, made for people who speak Arabic and English. It is the Russian twin of [Jidr](https://github.com/natmartem/jidr): it teaches how the language is built and leans on what the learner already knows. It runs fully offline once opened, and progress stays on the device.

The course has two dimensions:

- **Topics** — everyday vocabulary: hello, family, food, in the house, the city, transport, the body, days, months, numbers, verbs, describing, shopping, work, international words.
- **Principles** — how Russian is built: no “is” in the present, verb endings for every person (with не and verb + verb), в/на + where and where to, objects (masculine alive or not, feminine -у, me/you/him), мой/моя with adjectives, plurals and этот, мне нравится and мне холодно, у меня есть / нет, numbers 1/2–4/5+, chunks to learn whole, -tion → -ция, -ism/-ist, -logy/-ics, root families, the root ход with prefixes, the doer (-тель), stress, and Latin look-alike letters.

Every word names its topic and the principles it shows, so each principle points to real words inside the topics.

**Combinations.** `course.js` also holds tables of noun forms, adjectives and verb forms. The app crosses them with the principles to generate drill sentences (about 1,300 at the moment): every noun in every case it fits, every adjective with the nouns it suits, every verb with every person. Wrong options are always the same word in other forms. Add a noun or verb to a table and it appears in every principle it fits.

**Writing and reading drills.** Typed gaps, building sentences from word tiles (with one wrong form mixed in), gap-fills in real sentences, listen-and-type, and a “Practise this text” mode on every reading.

## Files

- `index.html` — the app
- `course.js` — the lessons (topics, principles with explanations in English and Arabic, words, phrases, readings, fun facts)
- `record.html` — a page for a native speaker to record pronunciations (`record.html?speaker=2` for a second voice)
- `sw.js`, `manifest.webmanifest`, `icons/` — offline support and install on the home screen
- `fonts/` — self-hosted fonts
- `tools/check.mjs` — checks the lessons (stress marks on every word and form, valid topics and principles, table shapes, drill answers that differ); runs on GitHub after every push. `node tools/check.mjs --words` also lists words in readings that the course doesn't teach yet

## Putting it online (GitHub Pages)

1. Create a new public repository, for example `koren`, and upload all these files (keep the folders).
2. Settings → Pages → Source: “Deploy from a branch”, branch `main`, folder `/ (root)`.
3. After a minute the app is at `https://<your-name>.github.io/koren/`.
4. On iPhone: open that link in Safari → Share → Add to Home Screen.

## Adding recordings

The speaker opens `record.html`, records, and taps **Send recordings**. Upload the file they send (`koren-audio.json`, or `koren-audio-2.json` for the second voice) to the root of the repository. Phones pick it up the next time the app opens online. Until then, More → Import a recordings file plays them on one phone. Without recordings the app uses the phone's Russian voice.

## Adding lessons

Either edit `course.js` (the format is described at the top of the file) and run `node tools/check.mjs`, or ask Claude for a **lesson pack** (JSON with `id`, `title` and any of `topics`, `principles`, `words`, `phrases`, `readings`) and paste it in More → Add a lesson pack. Progress is never touched by either route. Do not change the Russian of an item that already has a recording: that is its audio key.

## Licenses

| Part | License |
|---|---|
| Code: `index.html`, `record.html`, `sw.js`, `manifest.webmanifest`, `tools/` | [GNU AGPL-3.0-or-later](LICENSE) |
| Course content: `course.js` | [CC BY-NC-SA 4.0](LICENSE-CONTENT.txt) |
| Fonts in `fonts/` (Onest, Unbounded, Noto Naskh Arabic) | SIL Open Font License 1.1, see `fonts/LICENSE-*.txt` |
| Audio recordings (`koren-audio*.json`, if present) | Not licensed. All rights remain with the person who recorded them. |

## How it was made

Built with AI assistance (Claude, by Anthropic). The design, learning approach and lesson selection were directed by natmartem, who reviews and curates every change and tests the app on a real device. Purely machine-written parts may not be protected by copyright in some countries; the licenses above apply to everything that is.

Copyright © 2026 natmartem.
