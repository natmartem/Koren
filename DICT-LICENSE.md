# koren-dict.json

The Russian–English dictionary behind tap-a-word in song and poem texts.

Data: [OpenRussian.org](https://en.openrussian.org), built from Wiktionary with corrections by the OpenRussian team and its users,
taken from the public export at https://github.com/Badestrand/russian-dictionary.
Licence: [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Koren keeps the most frequent entries (about 15,000), shortens the English meanings and lists each word's forms with stress marks.
That adapted file is shared under the same licence, CC BY-SA 4.0, separately from the rest of Koren's content.

To rebuild it: `git clone --depth 1 https://github.com/Badestrand/russian-dictionary /tmp/ord && node tools/build-dict.mjs /tmp/ord`
