.pragma library

.import "Canon.js" as Canon

var STATE_VERSION = 1
var OMITTED_VERSE_TEXT = "Not included in this translation."
var DEFAULT_COPY_FORMAT = "numbered"

function fileUrlToPath(url) {
  var s = String(url || "")
  if (s.indexOf("file://") === 0) {
    s = s.substring(7)
    if (s.charAt(0) !== "/") s = "/" + s
    try { s = decodeURIComponent(s) } catch (e) {}
  }
  return s
}

function versesFor(bible, bookId, chapter) {
  if (!bible || !bible.books) return []
  for (var i = 0; i < bible.books.length; i++) {
    var b = bible.books[i]
    if (b.id !== bookId) continue
    var ch = b.chapters[chapter - 1]
    if (!ch) return []
    var out = []
    for (var v = 0; v < ch.length; v++) {
      var text = typeof ch[v] === "string" ? ch[v].trim() : ""
      var omitted = text === ""
      out.push({
        n: v + 1,
        text: omitted ? OMITTED_VERSE_TEXT : text,
        omitted: omitted
      })
    }
    return out
  }
  return []
}

function verseCount(bible, bookId, chapter) {
  return versesFor(bible, bookId, chapter).length
}

function clampVerse(bible, bookId, chapter, verse) {
  var count = verseCount(bible, bookId, chapter)
  if (count <= 0) return 1
  var n = typeof verse === "number" && Math.floor(verse) === verse ? verse : 1
  if (n < 1) return 1
  if (n > count) return count
  return n
}

function resolveReference(input, bible) {
  var place = Canon.parseReference(input)
  if (!place) return null
  var count = verseCount(bible, place.book, place.chapter)
  if (count <= 0 || place.verse > count) return null
  return place
}

function formatCopiedVerses(bible, bookId, chapter, startVerseOrList, endVerse, copyFormat) {
  var verses = versesFor(bible, bookId, chapter)
  if (!verses || verses.length === 0) return ""
  var count = verses.length

  var list = []
  var fmt = DEFAULT_COPY_FORMAT

  if (Array.isArray(startVerseOrList)) {
    list = startVerseOrList
    fmt = (typeof endVerse === "string" ? endVerse : copyFormat) || DEFAULT_COPY_FORMAT
  } else {
    var s = typeof startVerseOrList === "number" && Math.floor(startVerseOrList) === startVerseOrList ? startVerseOrList : 1
    var e = typeof endVerse === "number" && Math.floor(endVerse) === endVerse ? endVerse : s
    var minV = Math.max(1, Math.min(Math.min(s, e), count))
    var maxV = Math.max(1, Math.min(Math.max(s, e), count))
    for (var k = minV; k <= maxV; k++) list.push(k)
    fmt = copyFormat || DEFAULT_COPY_FORMAT
  }

  var sortedNums = []
  for (var i = 0; i < list.length; i++) {
    var num = list[i]
    if (typeof num === "number" && num >= 1 && num <= count && sortedNums.indexOf(num) === -1) {
      sortedNums.push(num)
    }
  }
  sortedNums.sort(function(a, b) { return a - b })
  if (sortedNums.length === 0) return ""

  var selected = []
  for (var j = 0; j < sortedNums.length; j++) {
    var v = verses[sortedNums[j] - 1]
    if (v && !v.omitted) selected.push(v)
  }

  var isSingle = (sortedNums.length === 1)
  var body = ""

  if (selected.length === 0) {
    body = OMITTED_VERSE_TEXT
  } else if (isSingle) {
    body = selected[0].text
  } else if (fmt === "paragraph") {
    body = selected.map(function(v) { return v.text }).join(" ")
  } else if (fmt === "lines") {
    body = selected.map(function(v) { return v.n + " " + v.text }).join("\n")
  } else {
    // default: "numbered"
    body = selected.map(function(v) { return v.n + " " + v.text }).join(" ")
  }

  var ref = Canon.formatRefList(bookId, chapter, sortedNums, false)
  return '"' + body + '"\n— ' + ref
}

function parseState(json, bible) {
  var data = null
  try { data = json ? JSON.parse(json) : null } catch (e) { data = null }
  var book = Canon.DEFAULT_BOOK
  var chapter = Canon.DEFAULT_CHAPTER
  var verse = Canon.DEFAULT_VERSE
  var copyFormat = DEFAULT_COPY_FORMAT
  if (data && typeof data === "object") {
    if (typeof data.book === "string" && Canon.bookById(data.book)) book = data.book
    if (typeof data.chapter === "number" && Canon.isValidPlace(book, data.chapter, 1))
      chapter = data.chapter
    if (typeof data.verse === "number" && data.verse >= 1 && Math.floor(data.verse) === data.verse)
      verse = data.verse
    if (data.copyFormat === "numbered" || data.copyFormat === "paragraph" || data.copyFormat === "lines")
      copyFormat = data.copyFormat
  }
  verse = clampVerse(bible, book, chapter, verse)
  return { book: book, chapter: chapter, verse: verse, copyFormat: copyFormat }
}

function serializeState(book, chapter, verse, copyFormat) {
  return JSON.stringify({
    version: STATE_VERSION,
    translation: "BSB",
    book: book,
    chapter: chapter,
    verse: verse,
    copyFormat: copyFormat || DEFAULT_COPY_FORMAT
  })
}
