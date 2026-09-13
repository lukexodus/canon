.pragma library

// Protestant canon: 39 OT + 27 NT. Aliases are lowercase with spaces
// collapsed. Numbers may be written as "1", "i", or "first".

var BOOKS = [
  { id: "Genesis", name: "Genesis", abbrev: "Gen", testament: "ot", chapters: 50 },
  { id: "Exodus", name: "Exodus", abbrev: "Exod", testament: "ot", chapters: 40 },
  { id: "Leviticus", name: "Leviticus", abbrev: "Lev", testament: "ot", chapters: 27 },
  { id: "Numbers", name: "Numbers", abbrev: "Num", testament: "ot", chapters: 36 },
  { id: "Deuteronomy", name: "Deuteronomy", abbrev: "Deut", testament: "ot", chapters: 34 },
  { id: "Joshua", name: "Joshua", abbrev: "Josh", testament: "ot", chapters: 24 },
  { id: "Judges", name: "Judges", abbrev: "Judg", testament: "ot", chapters: 21 },
  { id: "Ruth", name: "Ruth", abbrev: "Ruth", testament: "ot", chapters: 4 },
  { id: "1 Samuel", name: "1 Samuel", abbrev: "1 Sam", testament: "ot", chapters: 31 },
  { id: "2 Samuel", name: "2 Samuel", abbrev: "2 Sam", testament: "ot", chapters: 24 },
  { id: "1 Kings", name: "1 Kings", abbrev: "1 Kgs", testament: "ot", chapters: 22 },
  { id: "2 Kings", name: "2 Kings", abbrev: "2 Kgs", testament: "ot", chapters: 25 },
  { id: "1 Chronicles", name: "1 Chronicles", abbrev: "1 Chr", testament: "ot", chapters: 29 },
  { id: "2 Chronicles", name: "2 Chronicles", abbrev: "2 Chr", testament: "ot", chapters: 36 },
  { id: "Ezra", name: "Ezra", abbrev: "Ezra", testament: "ot", chapters: 10 },
  { id: "Nehemiah", name: "Nehemiah", abbrev: "Neh", testament: "ot", chapters: 13 },
  { id: "Esther", name: "Esther", abbrev: "Esth", testament: "ot", chapters: 10 },
  { id: "Job", name: "Job", abbrev: "Job", testament: "ot", chapters: 42 },
  { id: "Psalms", name: "Psalms", abbrev: "Ps", testament: "ot", chapters: 150 },
  { id: "Proverbs", name: "Proverbs", abbrev: "Prov", testament: "ot", chapters: 31 },
  { id: "Ecclesiastes", name: "Ecclesiastes", abbrev: "Eccl", testament: "ot", chapters: 12 },
  { id: "Song of Solomon", name: "Song of Solomon", abbrev: "Song", testament: "ot", chapters: 8 },
  { id: "Isaiah", name: "Isaiah", abbrev: "Isa", testament: "ot", chapters: 66 },
  { id: "Jeremiah", name: "Jeremiah", abbrev: "Jer", testament: "ot", chapters: 52 },
  { id: "Lamentations", name: "Lamentations", abbrev: "Lam", testament: "ot", chapters: 5 },
  { id: "Ezekiel", name: "Ezekiel", abbrev: "Ezek", testament: "ot", chapters: 48 },
  { id: "Daniel", name: "Daniel", abbrev: "Dan", testament: "ot", chapters: 12 },
  { id: "Hosea", name: "Hosea", abbrev: "Hos", testament: "ot", chapters: 14 },
  { id: "Joel", name: "Joel", abbrev: "Joel", testament: "ot", chapters: 3 },
  { id: "Amos", name: "Amos", abbrev: "Amos", testament: "ot", chapters: 9 },
  { id: "Obadiah", name: "Obadiah", abbrev: "Obad", testament: "ot", chapters: 1 },
  { id: "Jonah", name: "Jonah", abbrev: "Jonah", testament: "ot", chapters: 4 },
  { id: "Micah", name: "Micah", abbrev: "Mic", testament: "ot", chapters: 7 },
  { id: "Nahum", name: "Nahum", abbrev: "Nah", testament: "ot", chapters: 3 },
  { id: "Habakkuk", name: "Habakkuk", abbrev: "Hab", testament: "ot", chapters: 3 },
  { id: "Zephaniah", name: "Zephaniah", abbrev: "Zeph", testament: "ot", chapters: 3 },
  { id: "Haggai", name: "Haggai", abbrev: "Hag", testament: "ot", chapters: 2 },
  { id: "Zechariah", name: "Zechariah", abbrev: "Zech", testament: "ot", chapters: 14 },
  { id: "Malachi", name: "Malachi", abbrev: "Mal", testament: "ot", chapters: 4 },
  { id: "Matthew", name: "Matthew", abbrev: "Matt", testament: "nt", chapters: 28 },
  { id: "Mark", name: "Mark", abbrev: "Mark", testament: "nt", chapters: 16 },
  { id: "Luke", name: "Luke", abbrev: "Luke", testament: "nt", chapters: 24 },
  { id: "John", name: "John", abbrev: "John", testament: "nt", chapters: 21 },
  { id: "Acts", name: "Acts", abbrev: "Acts", testament: "nt", chapters: 28 },
  { id: "Romans", name: "Romans", abbrev: "Rom", testament: "nt", chapters: 16 },
  { id: "1 Corinthians", name: "1 Corinthians", abbrev: "1 Cor", testament: "nt", chapters: 16 },
  { id: "2 Corinthians", name: "2 Corinthians", abbrev: "2 Cor", testament: "nt", chapters: 13 },
  { id: "Galatians", name: "Galatians", abbrev: "Gal", testament: "nt", chapters: 6 },
  { id: "Ephesians", name: "Ephesians", abbrev: "Eph", testament: "nt", chapters: 6 },
  { id: "Philippians", name: "Philippians", abbrev: "Phil", testament: "nt", chapters: 4 },
  { id: "Colossians", name: "Colossians", abbrev: "Col", testament: "nt", chapters: 4 },
  { id: "1 Thessalonians", name: "1 Thessalonians", abbrev: "1 Thess", testament: "nt", chapters: 5 },
  { id: "2 Thessalonians", name: "2 Thessalonians", abbrev: "2 Thess", testament: "nt", chapters: 3 },
  { id: "1 Timothy", name: "1 Timothy", abbrev: "1 Tim", testament: "nt", chapters: 6 },
  { id: "2 Timothy", name: "2 Timothy", abbrev: "2 Tim", testament: "nt", chapters: 4 },
  { id: "Titus", name: "Titus", abbrev: "Titus", testament: "nt", chapters: 3 },
  { id: "Philemon", name: "Philemon", abbrev: "Phlm", testament: "nt", chapters: 1 },
  { id: "Hebrews", name: "Hebrews", abbrev: "Heb", testament: "nt", chapters: 13 },
  { id: "James", name: "James", abbrev: "Jas", testament: "nt", chapters: 5 },
  { id: "1 Peter", name: "1 Peter", abbrev: "1 Pet", testament: "nt", chapters: 5 },
  { id: "2 Peter", name: "2 Peter", abbrev: "2 Pet", testament: "nt", chapters: 3 },
  { id: "1 John", name: "1 John", abbrev: "1 John", testament: "nt", chapters: 5 },
  { id: "2 John", name: "2 John", abbrev: "2 John", testament: "nt", chapters: 1 },
  { id: "3 John", name: "3 John", abbrev: "3 John", testament: "nt", chapters: 1 },
  { id: "Jude", name: "Jude", abbrev: "Jude", testament: "nt", chapters: 1 },
  { id: "Revelation", name: "Revelation", abbrev: "Rev", testament: "nt", chapters: 22 }
]

var DEFAULT_BOOK = "Genesis"
var DEFAULT_CHAPTER = 1
var DEFAULT_VERSE = 1

var ALIAS_EXTRAS = {
  "gen": "Genesis", "ge": "Genesis", "gn": "Genesis",
  "ex": "Exodus", "exo": "Exodus", "exod": "Exodus",
  "lev": "Leviticus", "le": "Leviticus", "lv": "Leviticus",
  "num": "Numbers", "nu": "Numbers", "nm": "Numbers", "nb": "Numbers",
  "deut": "Deuteronomy", "de": "Deuteronomy", "dt": "Deuteronomy",
  "josh": "Joshua", "jos": "Joshua",
  "judg": "Judges", "jdg": "Judges", "jg": "Judges",
  "ru": "Ruth",
  "1sam": "1 Samuel", "1sa": "1 Samuel", "1sm": "1 Samuel",
  "2sam": "2 Samuel", "2sa": "2 Samuel", "2sm": "2 Samuel",
  "1kgs": "1 Kings", "1ki": "1 Kings", "1k": "1 Kings",
  "2kgs": "2 Kings", "2ki": "2 Kings", "2k": "2 Kings",
  "1chr": "1 Chronicles", "1ch": "1 Chronicles",
  "2chr": "2 Chronicles", "2ch": "2 Chronicles",
  "ezr": "Ezra",
  "neh": "Nehemiah", "ne": "Nehemiah",
  "esth": "Esther", "est": "Esther", "es": "Esther",
  "jb": "Job",
  "ps": "Psalms", "psa": "Psalms", "psalm": "Psalms", "pss": "Psalms",
  "prov": "Proverbs", "pro": "Proverbs", "prv": "Proverbs", "pr": "Proverbs",
  "eccl": "Ecclesiastes", "ecc": "Ecclesiastes", "ec": "Ecclesiastes", "qoh": "Ecclesiastes",
  "song": "Song of Solomon", "sos": "Song of Solomon", "so": "Song of Solomon",
  "ss": "Song of Solomon", "canticle": "Song of Solomon", "canticles": "Song of Solomon",
  "isa": "Isaiah", "is": "Isaiah",
  "jer": "Jeremiah", "je": "Jeremiah",
  "lam": "Lamentations", "la": "Lamentations",
  "ezek": "Ezekiel", "eze": "Ezekiel", "ezk": "Ezekiel",
  "dan": "Daniel", "da": "Daniel", "dn": "Daniel",
  "hos": "Hosea", "ho": "Hosea",
  "jl": "Joel",
  "am": "Amos",
  "obad": "Obadiah", "ob": "Obadiah",
  "jnh": "Jonah", "jon": "Jonah",
  "mic": "Micah", "mi": "Micah",
  "nah": "Nahum", "na": "Nahum",
  "hab": "Habakkuk",
  "zeph": "Zephaniah", "zep": "Zephaniah", "zp": "Zephaniah",
  "hag": "Haggai", "hg": "Haggai",
  "zech": "Zechariah", "zec": "Zechariah", "zc": "Zechariah",
  "mal": "Malachi",
  "matt": "Matthew", "mat": "Matthew", "mt": "Matthew",
  "mk": "Mark", "mr": "Mark", "mrk": "Mark",
  "lk": "Luke", "lu": "Luke",
  "jn": "John", "joh": "John",
  "act": "Acts",
  "rom": "Romans", "ro": "Romans", "rm": "Romans",
  "1cor": "1 Corinthians", "1co": "1 Corinthians",
  "2cor": "2 Corinthians", "2co": "2 Corinthians",
  "gal": "Galatians", "ga": "Galatians",
  "eph": "Ephesians",
  "phil": "Philippians", "php": "Philippians", "pp": "Philippians",
  "col": "Colossians",
  "1thess": "1 Thessalonians", "1thes": "1 Thessalonians", "1th": "1 Thessalonians",
  "2thess": "2 Thessalonians", "2thes": "2 Thessalonians", "2th": "2 Thessalonians",
  "1tim": "1 Timothy", "1ti": "1 Timothy",
  "2tim": "2 Timothy", "2ti": "2 Timothy",
  "tit": "Titus", "ti": "Titus",
  "phlm": "Philemon", "phm": "Philemon", "philem": "Philemon",
  "heb": "Hebrews",
  "jas": "James", "jam": "James", "jm": "James",
  "1pet": "1 Peter", "1pe": "1 Peter", "1pt": "1 Peter",
  "2pet": "2 Peter", "2pe": "2 Peter", "2pt": "2 Peter",
  "1jn": "1 John", "1joh": "1 John", "1jo": "1 John",
  "2jn": "2 John", "2joh": "2 John", "2jo": "2 John",
  "3jn": "3 John", "3joh": "3 John", "3jo": "3 John",
  "jud": "Jude", "jd": "Jude",
  "rev": "Revelation", "re": "Revelation", "apoc": "Revelation", "apocalypse": "Revelation"
}

var _aliasMap = null
var _bookById = null

function _collapse(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function _ordinalPrefix(s) {
  return String(s || "")
    .replace(/^(first|1st|i)\s+/i, "1 ")
    .replace(/^(second|2nd|ii)\s+/i, "2 ")
    .replace(/^(third|3rd|iii)\s+/i, "3 ")
}

function _ensureIndexes() {
  if (_aliasMap) return
  _aliasMap = {}
  _bookById = {}
  var i, book, key
  for (i = 0; i < BOOKS.length; i++) {
    book = BOOKS[i]
    _bookById[book.id] = book
    _aliasMap[_collapse(book.id)] = book.id
    _aliasMap[_collapse(book.name)] = book.id
    _aliasMap[_collapse(book.abbrev)] = book.id
  }
  for (key in ALIAS_EXTRAS) _aliasMap[_collapse(key)] = ALIAS_EXTRAS[key]
}

function bookById(id) {
  _ensureIndexes()
  return _bookById[id] || null
}

function booksForTestament(which) {
  var out = []
  for (var i = 0; i < BOOKS.length; i++) {
    if (BOOKS[i].testament === which) out.push(BOOKS[i])
  }
  return out
}

function chapterCount(id) {
  var book = bookById(id)
  return book ? book.chapters : 0
}

function isValidPlace(bookId, chapter, verse) {
  var book = bookById(bookId)
  if (!book) return false
  if (typeof chapter !== "number" || chapter < 1 || chapter > book.chapters || Math.floor(chapter) !== chapter)
    return false
  if (verse === undefined || verse === null) return true
  return typeof verse === "number" && verse >= 1 && Math.floor(verse) === verse
}

function formatRef(bookId, chapter, verse, compact) {
  var book = bookById(bookId)
  var name = book ? (compact ? book.abbrev : book.name) : (bookId || "")
  if (!chapter) return name || "Canon"
  if (!verse) return name + " " + chapter
  return name + " " + chapter + ":" + verse
}

function formatRefRange(bookId, chapter, startVerse, endVerse, compact) {
  var book = bookById(bookId)
  var name = book ? (compact ? book.abbrev : book.name) : (bookId || "")
  if (!chapter) return name || "Canon"
  if (!startVerse) return name + " " + chapter
  if (!endVerse || startVerse === endVerse) return name + " " + chapter + ":" + startVerse
  var s = Math.min(startVerse, endVerse)
  var e = Math.max(startVerse, endVerse)
  return name + " " + chapter + ":" + s + "-" + e
}

function parseReference(input) {
  var raw = String(input || "").trim()
  if (!raw) return null
  raw = _ordinalPrefix(raw).replace(/[.]+/g, " ")
  var m = raw.match(/^(.+?)\s+(\d+)(?:\s*[:.]\s*(\d+))?$/)
  var bookPart = raw
  var chapter = 1
  var verse = 1
  if (m) {
    bookPart = m[1]
    chapter = parseInt(m[2], 10)
    verse = m[3] ? parseInt(m[3], 10) : 1
  } else {
    var glued = raw.match(/^(.+?)(\d+)$/)
    if (glued) {
      bookPart = glued[1]
      chapter = parseInt(glued[2], 10)
    }
  }
  _ensureIndexes()
  var id = _aliasMap[_collapse(bookPart)]
  if (!id) return null
  if (!isValidPlace(id, chapter, verse)) return null
  return { book: id, chapter: chapter, verse: verse }
}

function bookSelectionPlace(bookId) {
  if (!bookById(bookId)) return null
  return { book: bookId, chapter: DEFAULT_CHAPTER, verse: DEFAULT_VERSE }
}

function nextChapter(bookId, chapter) {
  var book = bookById(bookId)
  if (!book) return { book: DEFAULT_BOOK, chapter: DEFAULT_CHAPTER }
  if (chapter < book.chapters) return { book: bookId, chapter: chapter + 1 }
  var idx = -1
  for (var i = 0; i < BOOKS.length; i++) {
    if (BOOKS[i].id === bookId) { idx = i; break }
  }
  if (idx < 0 || idx === BOOKS.length - 1) return { book: bookId, chapter: book.chapters }
  return { book: BOOKS[idx + 1].id, chapter: 1 }
}

function prevChapter(bookId, chapter) {
  var book = bookById(bookId)
  if (!book) return { book: DEFAULT_BOOK, chapter: DEFAULT_CHAPTER }
  if (chapter > 1) return { book: bookId, chapter: chapter - 1 }
  var idx = -1
  for (var i = 0; i < BOOKS.length; i++) {
    if (BOOKS[i].id === bookId) { idx = i; break }
  }
  if (idx <= 0) return { book: bookId, chapter: 1 }
  var prev = BOOKS[idx - 1]
  return { book: prev.id, chapter: prev.chapters }
}
