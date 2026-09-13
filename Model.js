.pragma library

.import "Canon.js" as Canon

var STATE_VERSION = 1
var OMITTED_VERSE_TEXT = "Not included in this translation."
var DEFAULT_COPY_FORMAT = "numbered"
var DEFAULT_FONT_SIZE = "normal"

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
  if (typeof place.endVerse === "number") {
    place.endVerse = clampVerse(bible, place.book, place.chapter, place.endVerse)
    var s = Math.min(place.verse, place.endVerse)
    var e = Math.max(place.verse, place.endVerse)
    place.verse = s
    place.endVerse = e
  } else {
    place.endVerse = place.verse
  }
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
    body = selected.map(function(v) { return toSuperscript(v.n) + " " + v.text }).join("\n")
  } else {
    // default: "numbered"
    body = selected.map(function(v) { return toSuperscript(v.n) + " " + v.text }).join(" ")
  }

  var ref = Canon.formatRefList(bookId, chapter, sortedNums, false)
  return '"' + body + '"\n— ' + ref
}

var SUPERSCRIPT_DIGITS = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹"
}

function toSuperscript(num) {
  return String(num === undefined || num === null ? "" : num).replace(/[0-9]/g, function(d) {
    return SUPERSCRIPT_DIGITS[d] || d
  })
}

function parseState(json, bible) {
  var data = null
  try { data = json ? JSON.parse(json) : null } catch (e) { data = null }
  var book = Canon.DEFAULT_BOOK
  var chapter = Canon.DEFAULT_CHAPTER
  var verse = Canon.DEFAULT_VERSE
  var copyFormat = DEFAULT_COPY_FORMAT
  var fontSize = DEFAULT_FONT_SIZE
  var bookmarks = []
  if (data && typeof data === "object") {
    if (typeof data.book === "string" && Canon.bookById(data.book)) book = data.book
    if (typeof data.chapter === "number" && Canon.isValidPlace(book, data.chapter, 1))
      chapter = data.chapter
    if (typeof data.verse === "number" && data.verse >= 1 && Math.floor(data.verse) === data.verse)
      verse = data.verse
    if (data.copyFormat === "numbered" || data.copyFormat === "paragraph" || data.copyFormat === "lines")
      copyFormat = data.copyFormat
    if (data.fontSize === "compact" || data.fontSize === "normal" || data.fontSize === "large")
      fontSize = data.fontSize
    if (Array.isArray(data.bookmarks)) {
      for (var i = 0; i < data.bookmarks.length; i++) {
        var bm = data.bookmarks[i]
        if (bm && typeof bm.book === "string" && Canon.bookById(bm.book) && typeof bm.chapter === "number" && Canon.isValidPlace(bm.book, bm.chapter, 1)) {
          var v = clampVerse(bible, bm.book, bm.chapter, bm.verse || 1)
          var sv = Array.isArray(bm.selectedVerses) && bm.selectedVerses.length > 0
            ? bm.selectedVerses.map(function(num) { return clampVerse(bible, bm.book, bm.chapter, num) })
            : [v]
          var label = typeof bm.label === "string" && bm.label ? bm.label : Canon.formatRefList(bm.book, bm.chapter, sv, false)
          var preview = typeof bm.preview === "string" ? bm.preview : ""
          bookmarks.push({
            book: bm.book,
            chapter: bm.chapter,
            verse: v,
            selectedVerses: sv,
            label: label,
            preview: preview
          })
        }
      }
    }
  }
  verse = clampVerse(bible, book, chapter, verse)
  return {
    book: book,
    chapter: chapter,
    verse: verse,
    copyFormat: copyFormat,
    fontSize: fontSize,
    bookmarks: bookmarks
  }
}

function serializeState(book, chapter, verse, copyFormat, fontSize, bookmarks) {
  return JSON.stringify({
    version: STATE_VERSION,
    translation: "BSB",
    book: book,
    chapter: chapter,
    verse: verse,
    copyFormat: copyFormat || DEFAULT_COPY_FORMAT,
    fontSize: fontSize || DEFAULT_FONT_SIZE,
    bookmarks: Array.isArray(bookmarks) ? bookmarks : []
  })
}

function findBookmarkIndex(bookmarks, bookId, chapter, verse, selectedVerses) {
  if (!Array.isArray(bookmarks)) return -1
  var isMulti = Array.isArray(selectedVerses) && selectedVerses.length > 1
  for (var i = 0; i < bookmarks.length; i++) {
    var b = bookmarks[i]
    if (b.book !== bookId || b.chapter !== chapter) continue
    var bMulti = Array.isArray(b.selectedVerses) && b.selectedVerses.length > 1
    if (isMulti || bMulti) {
      var listA = isMulti ? selectedVerses : [verse || 1]
      var listB = bMulti ? b.selectedVerses : [b.verse || 1]
      if (listA.length === listB.length) {
        var match = true
        for (var k = 0; k < listA.length; k++) {
          if (listA[k] !== listB[k]) { match = false; break }
        }
        if (match) return i
      }
    } else {
      if ((b.verse || 1) === (verse || 1)) return i
    }
  }
  return -1
}

function pushHistory(history, index, entry, limit) {
  var max = limit || 50
  var hist = history ? history.slice(0, index + 1) : []
  var item = {
    book: entry.book,
    chapter: entry.chapter,
    verse: entry.verse || 1,
    selectedVerses: Array.isArray(entry.selectedVerses) && entry.selectedVerses.length > 0
      ? entry.selectedVerses.slice()
      : [entry.verse || 1]
  }
  if (hist.length > 0) {
    var last = hist[hist.length - 1]
    if (last.book === item.book && last.chapter === item.chapter) {
      last.verse = item.verse
      last.selectedVerses = item.selectedVerses
      return { history: hist, index: hist.length - 1 }
    }
  }
  hist.push(item)
  var newIdx = hist.length - 1
  if (hist.length > max) {
    hist.shift()
    newIdx--
  }
  return { history: hist, index: newIdx }
}

function updateCurrentHistory(history, index, verse, selectedVerses) {
  if (!history || index < 0 || index >= history.length) return history
  var hist = history.slice()
  var cur = Object.assign({}, hist[index])
  cur.verse = verse
  cur.selectedVerses = Array.isArray(selectedVerses) && selectedVerses.length > 0 ? selectedVerses.slice() : [verse]
  hist[index] = cur
  return hist
}
