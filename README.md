# Koren · Корень

A small installable web app for learning Russian, made for people who speak Arabic and English. It is the Russian twin of [Jidr](https://github.com/natmartem/jidr): it teaches how the language is built and leans on what the learner already knows. It runs fully offline once opened, and progress stays on the device.

The course has two dimensions:

- **Topics** — everyday vocabulary: hello, family, food, in the house, the city, transport, the body, days, months, numbers, verbs, describing, shopping, work, international words.
- **Principles** — how Russian is built: no “is” in the present, verb endings for every person (with не and verb + verb), в/на + where and where to, objects (masculine alive or not, feminine -у, me/you/him), мой/моя with adjectives, plurals and этот, мне нравится and мне холодно, у меня есть / нет, numbers 1/2–4/5+, chunks to learn whole, -tion → -ция, -ism/-ist, -logy/-ics, root families, the root ход with prefixes, the doer (-тель), stress, and Latin look-alike letters.

Every word names its topic and the principles it shows, so each principle points to real words inside the topics.

**How the app is organised.**
- **Path** — one line of small lessons that covers the whole course: every principle card, every word (topics are split into lessons of about seven words), every phrase and every reading. A phrase is taught at the first step where its topic has been reached and its grammar explained. Progress comes from drills only: a word lesson is done once each new word and phrase has been answered right at least once; a principle or reading step is done when most of its answers were right (otherwise the end screen offers one more round). Opening a card or a reading counts for nothing. The end screen goes straight to the next step.
- **Culture** — learn Russian through songs and poems, from easiest to hardest (Пусть всегда будет солнце, Кофевино, Чуковский's «Телефон», Что такое осень, Маяковский's «Что такое хорошо и что такое плохо?», Пять минут, Мандельштам's «Муха», Блок's «Ночь, улица, фонарь, аптека», Голубой вагон, Хочешь?, Песенка о медведях, Милая моя, Мне нравится, Звезда по имени Солнце, Жить в твоей голове, Выше крыш): the official video, short notes in English and Arabic, and small lessons built from the song's words. Song words live in the topic “Words from songs”, which is not on the path. Once learned in a song, a word counts as known everywhere: the path doesn't introduce it again, Practice reviews it, and drill sentences built on it appear. A song's sentences are drilled only after their principle cards are done on the path.
- **Practice** — review only: a mixed pool of what the path has already taught (words and phrases answered right at least once, drilled readings, practised principles and their combinations), by principle or by topic. Nothing new.
- **Topics** and **Principles** — reference: word lists, readings, explanation cards.
- **Listen** (Practice → Listen, or “Listen and repeat” on the path, a reading or a song) — hands-free listen and repeat for the street or the bus. The app plays recordings in a set order and leaves a pause after each one for the learner to say it aloud. Nothing is checked, scored or counted as progress. Sessions: today's mix (words you know, what's next on the path, sentences, a text, a quick second round, a few song lines), any text or dialogue (whole → line by line with pauses → whole again), any song or poem (the song → line by line → the song again) and any topic. Settings: pause length (short / medium / long; the pause also grows with the length of what you hear), how many times you hear each item (1–3×, voice 1 then voice 2), and whether today's mix includes a song.

The order of the path is `path` in `course.js`.

**Combinations.** `course.js` also holds tables of noun forms (with their plural), adjectives and verb forms. The app crosses them with the principles to generate drill sentences (about 6,500 at the moment): every noun in every frame and case it fits, every adjective with every noun it suits, every verb with every person, with and without не. Wrong options are always the same word in other forms. Add a noun or verb to a table and it appears in every principle it fits.

**Nothing before it's taught.** Every sentence, wrong option, gap and tile is checked word by word before it is shown: each word must be known (answered right at least once, or shown on a card whose step is done) and each ending must be explained (a form like `сестру́` needs the card for objects, `кни́ги` the card for many). A lesson may also use what it is teaching right now. So a drill can never ask about something the learner hasn't met, and as she learns more, every new word and ending is mixed into everything she already knows. `tools/order.mjs` walks the path the way a learner would and fails the build if a phrase, a reading (below 95% known words) or a principle step (fewer than 8 usable drills) would need something taught later. In `path`, `"t:hello:3"` places one lesson of a topic and `"t:hello"` places the rest.

**Writing and reading drills.** Typed gaps, building sentences from word tiles (with one wrong form mixed in), gap-fills in real sentences, listen-and-type, and a “Practise this text” mode on every reading.

**Every principle has several kinds of drill, easy to hard.** Grammar sentences: pick the form → hear the sentence and pick the form → build it from tiles → type the form → write the whole sentence from dictation. Stress: hear it and pick → from memory, then hear → “which one is stressed on the first / last syllable?”. Signs: read the sign → hear it and pick the sign → which sign says this. Word-building rules: English → Russian, meaning, type it. Inside a lesson the drills go from recognising to producing; in Practice each item gets the kind that fits how well it's known. Objects are also drilled with other people doing things (Ты ви́дишь бра́та? Мы ждём авто́бус.), once the verb endings are learned.

**Women by default.** The Arabic speaks to the learner in the feminine, and the Russian she says about herself is feminine (Я студе́нтка). More → Settings → “Speak to me as” switches both to the masculine. In `course.js` this is written ⟦feminine|masculine⟧; `tools/check.mjs` checks both versions and flags Arabic commands written only in the masculine. Pairs like тури́стка / тури́ст and учи́тельница / учи́тель are listed feminine first, and the readings share jobs and chores between women and men.

## Files

- `index.html` — the app
- `course.js` — the lessons (topics, principles with explanations in English and Arabic, words, phrases, readings, fun facts)
- `record.html` — a page for a native speaker to record pronunciations (`record.html?speaker=2` for a second voice)
- `sw.js`, `manifest.webmanifest`, `icons/` — offline support and install on the home screen
- `fonts/` — self-hosted fonts
- `tools/check.mjs` — checks the lessons (stress marks on every word and form, valid topics and principles, table shapes, drill answers that differ, and the path order via `tools/order.mjs`); runs on GitHub after every push. `node tools/order.mjs --all` shows every step: how many of its drills use only known words and endings, and how much of each reading is known

## Putting it online (GitHub Pages)

1. Create a new public repository, for example `koren`, and upload all these files (keep the folders).
2. Settings → Pages → Source: “Deploy from a branch”, branch `main`, folder `/ (root)`.
3. After a minute the app is at `https://<your-name>.github.io/koren/`.
4. On iPhone: open that link in Safari → Share → Add to Home Screen.

## Adding recordings

The speaker opens `record.html`, records, and taps **Send recordings**. Upload the file they send (`koren-audio.json`, or `koren-audio-2.json` for the second voice) to the root of the repository. Phones pick it up the next time the app opens online. Until then, More → Import a recordings file plays them on one phone. Without recordings the app uses the phone's Russian voice.

## Adding lessons

Either edit `course.js` (the format is described at the top of the file) and run `node tools/check.mjs`, or ask Claude for a **lesson pack** (JSON with `id`, `title` and any of `topics`, `principles`, `words`, `phrases`, `readings`, `songs`) and paste it in More → Add a lesson pack. Progress is never touched by either route. Do not change the Russian of an item that already has a recording: that is its audio key.

## How Listen plays sound

Recorded items are put together on the phone into one audio track per block of up to four minutes (recording, pause, recording, pause, with a soft two-note chime between parts), trimmed of silence and evened out in volume. Because it is one ordinary audio track, it keeps playing with the screen locked, and the lock screen and headphone buttons can pause and skip. Items without a recording use the phone's Russian voice, which needs the screen on. A song plays from the learner's own audio file if she adds one on the Listen page (it stays on the phone and also plays with the screen locked), otherwise from the video, which needs the screen on and the internet (tap it if it doesn't start by itself).

**Song and poem lines.** The speaker records them line by line on the recorder page, from the lyrics added in the app on that phone or pasted on the recorder page. They are sent as a separate file, `koren-song-lines.json` (or `-2` for the second voice), which the learner imports on her phone (More → Import a recordings file). Do **not** upload that file to GitHub: the lyrics are copyrighted. The main recordings file never contains song lines.

## Songs, poems and lyrics

Songs and poems are `songs` in `course.js` (the format is described above the list; a poem has `kind:"poem"`). Lyrics are **not** in the repository, because they are copyrighted. The learner adds them on the song page: copy the Russian text from a lyrics site and tap **Paste lyrics**, then (optionally) copy a translation and tap **Paste a translation**, which lines up with the Russian lines by itself. Any common format works: Russian only, `Russian | translation`, alternating lines, Russian first and the translation after, or LyricsTranslate's side-by-side copy; section labels like [Припев] are kept and bits lyrics sites add are dropped. They stay in that phone's storage only. They are never uploaded or added to feedback notes; backup files include them so they move with you to a new phone. Words the learner already knows are underlined in the lyrics.

To add a song, ask Claude for a lesson pack with `songs`, `words` (topic `songs`) and `phrases`, or edit `course.js` and run `node tools/check.mjs`.

The song-lines file a speaker sends from `record.html` (`koren-song-lines.json`) carries their recordings and the song text they pasted. Importing it on the learner's phone fills in the lyrics for any song that has none yet, so every recorded line matches; lyrics the learner already added are kept. The file is shared privately and never goes to GitHub.

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
