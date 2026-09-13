#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load(name, globals = {}) {
  const src = fs.readFileSync(path.join(__dirname, "..", name), "utf8")
    .split("\n")
    .filter((l) => !l.trim().startsWith(".pragma") && !l.trim().startsWith(".import"))
    .join("\n");
  const sandbox = { console, ...globals };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: name });
  return sandbox;
}

const C = load("Canon.js");
const M = load("Model.js", { Canon: C });
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name); }
}

ok("66 books", C.BOOKS.length === 66);
ok("john exists", !!C.bookById("John"));
ok("psalms 150", C.chapterCount("Psalms") === 150);
ok("jn 3:16", (() => {
  const p = C.parseReference("jn 3:16");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16;
})());
ok("john 3", (() => {
  const p = C.parseReference("john 3");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 1;
})());
ok("1 john 1:1", (() => {
  const p = C.parseReference("1 john 1:1");
  return p && p.book === "1 John" && p.chapter === 1 && p.verse === 1;
})());
ok("psalm 23", C.parseReference("psalm 23").book === "Psalms");
ok("song of solomon", C.parseReference("song 1").book === "Song of Solomon");
ok("rev 22", C.parseReference("rev 22").book === "Revelation");
ok("genesis 1 glued", C.parseReference("genesis1").chapter === 1);
ok("invalid book", C.parseReference("zzz 99") === null);
ok("invalid chapter", C.parseReference("jude 2") === null);
ok("invalid zero verse", C.parseReference("john 3:0") === null);
ok("book selection resets location", (() => {
  const p = C.bookSelectionPlace("Jude");
  return p && p.book === "Jude" && p.chapter === 1 && p.verse === 1;
})());
ok("invalid book selection", C.bookSelectionPlace("Not a book") === null);
ok("next wraps to next book", (() => {
  const n = C.nextChapter("Malachi", 4);
  return n.book === "Matthew" && n.chapter === 1;
})());
ok("next within same book", (() => {
  const n = C.nextChapter("Mark", 1);
  return n.book === "Mark" && n.chapter === 2;
})());
ok("next across book boundary", (() => {
  const n = C.nextChapter("Matthew", 28);
  return n.book === "Mark" && n.chapter === 1;
})());
ok("next stops at end of Revelation", (() => {
  const n = C.nextChapter("Revelation", 22);
  return n.book === "Revelation" && n.chapter === 22;
})());
ok("prev wraps to prev book", (() => {
  const n = C.prevChapter("Matthew", 1);
  return n.book === "Malachi" && n.chapter === 4;
})());
ok("compact ref", C.formatRef("John", 3, 16, true) === "John 3:16");

const bible = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data/bsb.json"), "utf8"));
ok("bsb 66", bible.books.length === 66);
ok("bsb chapter counts match canon", C.BOOKS.every((book) => {
  const dataBook = bible.books.find((candidate) => candidate.id === book.id);
  return dataBook && dataBook.chapters.length === book.chapters;
}));
ok("bsb chapters are populated", bible.books.every((book) =>
  book.chapters.every((chapter) => Array.isArray(chapter) && chapter.length > 0)
));
const john = bible.books.find((b) => b.id === "John");
ok("bsb john 3:16", john.chapters[2][15].indexOf("God so loved the world") !== -1);
ok("psalm 119 length", bible.books.find((b) => b.id === "Psalms").chapters[118].length === 176);
ok("valid final verse", M.resolveReference("john 3:36", bible).verse === 36);
ok("reject verse beyond chapter", M.resolveReference("john 3:37", bible) === null);
ok("reject far-out verse", M.resolveReference("john 3:999", bible) === null);

const johnFive = M.versesFor(bible, "John", 5);
ok("omitted verse keeps its number", johnFive[3].n === 4);
ok("omitted verse is labeled", johnFive[3].omitted && johnFive[3].text === M.OMITTED_VERSE_TEXT);
ok("reader model has no blank rows", bible.books.every((book) =>
  book.chapters.every((chapter, index) =>
    M.versesFor(bible, book.id, index + 1).every((v) => typeof v.text === "string" && v.text.trim() !== "")
  )
));

ok("valid state is restored", (() => {
  const p = M.parseState('{"book":"John","chapter":3,"verse":16}', bible);
  return p.book === "John" && p.chapter === 3 && p.verse === 16 && p.copyFormat === "numbered";
})());
ok("stale state verse is clamped", M.parseState('{"book":"John","chapter":3,"verse":999}', bible).verse === 36);
ok("fractional state verse is rejected", M.parseState('{"book":"John","chapter":3,"verse":1.5}', bible).verse === 1);
ok("malformed state uses defaults", (() => {
  const p = M.parseState('{broken', bible);
  return p.book === C.DEFAULT_BOOK && p.chapter === C.DEFAULT_CHAPTER && p.verse === C.DEFAULT_VERSE && p.copyFormat === "numbered";
})());
ok("invalid state location uses defaults", (() => {
  const p = M.parseState('{"book":"Jude","chapter":119,"verse":4}', bible);
  return p.book === "Jude" && p.chapter === C.DEFAULT_CHAPTER && p.verse === 4;
})());
ok("custom copyFormat state is restored", (() => {
  const p = M.parseState('{"book":"John","chapter":3,"verse":16,"copyFormat":"paragraph"}', bible);
  return p.copyFormat === "paragraph";
})());
ok("default fontSize is normal", M.DEFAULT_FONT_SIZE === "normal");
ok("custom fontSize state compact is restored", (() => {
  const p = M.parseState('{"book":"John","chapter":3,"verse":16,"fontSize":"compact"}', bible);
  return p.fontSize === "compact";
})());
ok("custom fontSize state large is restored", (() => {
  const p = M.parseState('{"book":"John","chapter":3,"verse":16,"fontSize":"large"}', bible);
  return p.fontSize === "large";
})());
ok("invalid fontSize falls back to normal", (() => {
  const p = M.parseState('{"book":"John","chapter":3,"verse":16,"fontSize":"huge"}', bible);
  return p.fontSize === "normal";
})());
ok("state serialization includes copyFormat and fontSize", (() => {
  const s = M.serializeState("Romans", 8, 28, "lines", "large");
  const p = JSON.parse(s);
  return p.book === "Romans" && p.chapter === 8 && p.verse === 28 && p.copyFormat === "lines" && p.fontSize === "large";
})());

ok("formatRefRange single verse", C.formatRefRange("Matthew", 6, 13, 13) === "Matthew 6:13");
ok("formatRefRange range with hyphen", C.formatRefRange("Matthew", 6, 9, 13) === "Matthew 6:9-13");
ok("formatRefRange reversed range with hyphen", C.formatRefRange("Matthew", 6, 13, 9) === "Matthew 6:9-13");
ok("formatRefRange compact", C.formatRefRange("Matthew", 6, 9, 13, true) === "Matt 6:9-13");

const singleCopied = M.formatCopiedVerses(bible, "Matthew", 6, 13, 13);
ok("single verse copy format has quotes and em-dash",
  singleCopied.startsWith('"') &&
  singleCopied.includes('"\n— Matthew 6:13') &&
  singleCopied.includes("deliver us from the evil one") &&
  !singleCopied.startsWith('"13 ')
);

ok("toSuperscript converts digits", M.toSuperscript(1234567890) === "¹²³⁴⁵⁶⁷⁸⁹⁰");

const rangeCopiedNumbered = M.formatCopiedVerses(bible, "Matthew", 6, 9, 13, "numbered");
ok("range verse copy format numbered default uses superscript",
  rangeCopiedNumbered.startsWith('"⁹ So then, this is how you should pray') &&
  rangeCopiedNumbered.includes(' ¹³ And lead us not into temptation') &&
  rangeCopiedNumbered.endsWith('"\n— Matthew 6:9-13')
);

const rangeCopiedParagraph = M.formatCopiedVerses(bible, "Matthew", 6, 9, 13, "paragraph");
ok("range verse copy format paragraph",
  rangeCopiedParagraph.startsWith('"So then, this is how you should pray') &&
  !rangeCopiedParagraph.includes('"9 ') &&
  !rangeCopiedParagraph.includes('"⁹ ') &&
  rangeCopiedParagraph.endsWith('"\n— Matthew 6:9-13')
);

const rangeCopiedLines = M.formatCopiedVerses(bible, "Matthew", 6, 9, 13, "lines");
ok("range verse copy format lines uses superscript",
  rangeCopiedLines.includes('\n¹⁰ ') &&
  rangeCopiedLines.includes('\n¹³ ') &&
  rangeCopiedLines.endsWith('"\n— Matthew 6:9-13')
);

const omittedRangeCopied = M.formatCopiedVerses(bible, "John", 5, 3, 5, "numbered");
ok("omitted verse in range is skipped in body",
  omittedRangeCopied.includes('"³ ') &&
  !omittedRangeCopied.includes(' ⁴ ') &&
  omittedRangeCopied.includes(' ⁵ ') &&
  omittedRangeCopied.endsWith('"\n— John 5:3-5')
);

ok("formatVerseRanges single", C.formatVerseRanges([13]) === "13");
ok("formatVerseRanges contiguous", C.formatVerseRanges([9, 10, 11, 12, 13]) === "9-13");
ok("formatVerseRanges non-contiguous", C.formatVerseRanges([9, 11, 13]) === "9, 11, 13");
ok("formatVerseRanges mixed out of order", C.formatVerseRanges([15, 9, 10, 14, 12]) === "9-10, 12, 14-15");
ok("formatRefList non-contiguous", C.formatRefList("Matthew", 6, [9, 11, 13]) === "Matthew 6:9, 11, 13");
ok("formatRefList mixed ranges", C.formatRefList("Matthew", 6, [9, 10, 12, 14, 15]) === "Matthew 6:9-10, 12, 14-15");

const nonContigCopied = M.formatCopiedVerses(bible, "Matthew", 6, [9, 11, 13], "numbered");
ok("non-contiguous copy format numbered has only selected verses with superscript",
  nonContigCopied.startsWith('"⁹ So then, this is how you should pray') &&
  nonContigCopied.includes(' ¹¹ Give us this day our daily bread.') &&
  !nonContigCopied.includes('¹⁰') &&
  nonContigCopied.includes(' ¹³ And lead us not into temptation') &&
  nonContigCopied.endsWith('"\n— Matthew 6:9, 11, 13')
);

const nonContigSingle = M.formatCopiedVerses(bible, "Matthew", 6, [13]);
ok("single verse via array has no verse number in body",
  nonContigSingle.startsWith('"And lead us not into temptation') &&
  nonContigSingle.endsWith('"\n— Matthew 6:13')
);

// Reference range parsing tests
ok("parseReference range John 3:16-18", (() => {
  const p = C.parseReference("John 3:16-18");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 18;
})());

ok("parseReference range Matt 6:9-13", (() => {
  const p = C.parseReference("Matt 6:9-13");
  return p && p.book === "Matthew" && p.chapter === 6 && p.verse === 9 && p.endVerse === 13;
})());

ok("parseReference range with dot abbreviation Matt. 6:9-13", (() => {
  const p = C.parseReference("Matt. 6:9-13");
  return p && p.book === "Matthew" && p.chapter === 6 && p.verse === 9 && p.endVerse === 13;
})());

ok("parseReference range 1 Cor 13:4-7", (() => {
  const p = C.parseReference("1 Cor 13:4-7");
  return p && p.book === "1 Corinthians" && p.chapter === 13 && p.verse === 4 && p.endVerse === 7;
})());

ok("parseReference range with spaces Romans 8:28 - 30", (() => {
  const p = C.parseReference("Romans 8:28 - 30");
  return p && p.book === "Romans" && p.chapter === 8 && p.verse === 28 && p.endVerse === 30;
})());

ok("parseReference range with en-dash John 3:16–18", (() => {
  const p = C.parseReference("John 3:16\u201318");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 18;
})());

ok("parseReference range with em-dash John 3:16—18", (() => {
  const p = C.parseReference("John 3:16\u201418");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 18;
})());

ok("parseReference reversed range normalized John 3:18-16", (() => {
  const p = C.parseReference("John 3:18-16");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 18;
})());

ok("parseReference single verse sets endVerse equal to verse", (() => {
  const p = C.parseReference("John 3:16");
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 16;
})());

ok("resolveReference clamps range exceeding chapter", (() => {
  const p = M.resolveReference("John 3:16-999", bible);
  return p && p.book === "John" && p.chapter === 3 && p.verse === 16 && p.endVerse === 36;
})());

ok("resolveReference valid range", (() => {
  const p = M.resolveReference("Matt 6:9-13", bible);
  return p && p.book === "Matthew" && p.chapter === 6 && p.verse === 9 && p.endVerse === 13;
})());

// Navigation history tests
ok("pushHistory initializes first entry at index 0", (() => {
  const res = M.pushHistory([], -1, { book: "Genesis", chapter: 1, verse: 1 });
  return res.history.length === 1 && res.index === 0 && res.history[0].book === "Genesis";
})());

ok("pushHistory appends new locations", (() => {
  let s = M.pushHistory([], -1, { book: "Genesis", chapter: 1, verse: 1 });
  s = M.pushHistory(s.history, s.index, { book: "Matthew", chapter: 6, verse: 13, selectedVerses: [13] });
  return s.history.length === 2 && s.index === 1 && s.history[1].book === "Matthew";
})());

ok("pushHistory avoids duplicate entries for same book and chapter", (() => {
  let s = M.pushHistory([], -1, { book: "Matthew", chapter: 6, verse: 9 });
  s = M.pushHistory(s.history, s.index, { book: "Matthew", chapter: 6, verse: 13, selectedVerses: [13] });
  return s.history.length === 1 && s.index === 0 && s.history[0].verse === 13;
})());

ok("updateCurrentHistory modifies verse in active entry", (() => {
  let s = M.pushHistory([], -1, { book: "Romans", chapter: 8, verse: 1 });
  const updated = M.updateCurrentHistory(s.history, s.index, 28, [28, 29, 30]);
  return updated[0].verse === 28 && updated[0].selectedVerses.length === 3;
})());

ok("pushHistory truncates forward history on branch", (() => {
  let s = M.pushHistory([], -1, { book: "Genesis", chapter: 1, verse: 1 });
  s = M.pushHistory(s.history, s.index, { book: "Matthew", chapter: 6, verse: 13 });
  s = M.pushHistory(s.history, s.index, { book: "John", chapter: 3, verse: 16 });
  // Go back to index 1 (Matthew)
  s = M.pushHistory(s.history, 1, { book: "Romans", chapter: 8, verse: 28 });
  return s.history.length === 3 && s.index === 2 && s.history[2].book === "Romans";
})());

ok("pushHistory caps at limit", (() => {
  let s = M.pushHistory([], -1, { book: "Genesis", chapter: 1, verse: 1 }, 3);
  s = M.pushHistory(s.history, s.index, { book: "Exodus", chapter: 1, verse: 1 }, 3);
  s = M.pushHistory(s.history, s.index, { book: "Leviticus", chapter: 1, verse: 1 }, 3);
  s = M.pushHistory(s.history, s.index, { book: "Numbers", chapter: 1, verse: 1 }, 3);
  return s.history.length === 3 && s.history[0].book === "Exodus" && s.index === 2;
})());

ok("findBookmarkIndex finds single verse", (() => {
  const bms = [
    { book: "John", chapter: 3, verse: 16, selectedVerses: [16] },
    { book: "Romans", chapter: 8, verse: 28, selectedVerses: [28, 29, 30] }
  ];
  return M.findBookmarkIndex(bms, "John", 3, 16, [16]) === 0 &&
         M.findBookmarkIndex(bms, "John", 3, 16) === 0;
})());

ok("findBookmarkIndex finds multi-verse range", (() => {
  const bms = [
    { book: "John", chapter: 3, verse: 16, selectedVerses: [16] },
    { book: "Romans", chapter: 8, verse: 28, selectedVerses: [28, 29, 30] }
  ];
  return M.findBookmarkIndex(bms, "Romans", 8, 28, [28, 29, 30]) === 1 &&
         M.findBookmarkIndex(bms, "Romans", 8, 28, [28]) === -1;
})());

ok("findBookmarkIndex returns -1 when not bookmarked", (() => {
  const bms = [{ book: "John", chapter: 3, verse: 16, selectedVerses: [16] }];
  return M.findBookmarkIndex(bms, "John", 3, 17) === -1 &&
         M.findBookmarkIndex(bms, "Matthew", 6, 13) === -1;
})());

ok("parseState parses valid bookmarks and filters corrupt ones", (() => {
  const raw = JSON.stringify({
    book: "John", chapter: 3, verse: 16,
    bookmarks: [
      { book: "Matthew", chapter: 6, verse: 13, selectedVerses: [13], label: "Matthew 6:13", preview: "And lead us not..." },
      { book: "FakeBook", chapter: 1, verse: 1 },
      { book: "John", chapter: 999, verse: 1 },
      { book: "Romans", chapter: 8, verse: 28, selectedVerses: [28, 29, 30], label: "Romans 8:28-30", preview: "And we know..." }
    ]
  });
  const res = M.parseState(raw, bible);
  return res.bookmarks.length === 2 &&
         res.bookmarks[0].label === "Matthew 6:13" &&
         res.bookmarks[1].label === "Romans 8:28-30";
})());

ok("serializeState includes bookmarks array", (() => {
  const bms = [{ book: "John", chapter: 3, verse: 16, selectedVerses: [16], label: "John 3:16", preview: "For God so loved..." }];
  const json = M.serializeState("John", 3, 16, "numbered", "normal", bms);
  const parsed = JSON.parse(json);
  return Array.isArray(parsed.bookmarks) && parsed.bookmarks.length === 1 && parsed.bookmarks[0].book === "John";
})());

console.log(fail === 0 ? `\n${pass} passed` : `\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
