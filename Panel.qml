import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui
import "Canon.js" as Canon
import "Model.js" as Model

Panel {
  id: root
  moduleName: "andrewbacon.canon"
  manageIpc: false

  property var anchorItem: null
  property var hostWidget: null
  readonly property var barIdentity: hostWidget || root

  property var bible: null
  property string book: Canon.DEFAULT_BOOK
  property int chapter: Canon.DEFAULT_CHAPTER
  property int verse: Canon.DEFAULT_VERSE
  property string searchText: ""
  property string searchError: ""
  property string browseMode: "read" // read | books | chapters
  property string browseTestament: "ot"
  property bool stateReady: false

  readonly property color contentForeground: bar ? bar.foreground : Color.foreground
  readonly property color mutedForeground: Color.muted
  readonly property color accentColor: Color.accent
  readonly property string contentFontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property var currentVerses: Model.versesFor(root.bible, root.book, root.chapter)
  readonly property string label: Canon.formatRef(root.book, root.chapter, root.verse, true)
  readonly property string tooltipLabel: Canon.formatRef(root.book, root.chapter, root.verse, false) + " · BSB"
  readonly property var otBooks: Canon.booksForTestament("ot")
  readonly property var ntBooks: Canon.booksForTestament("nt")
  readonly property var browseBooks: root.browseTestament === "nt" ? root.ntBooks : root.otBooks
  readonly property var currentBookInfo: Canon.bookById(root.book)
  readonly property int chapterTotal: currentBookInfo ? currentBookInfo.chapters : 0

  function open() {
    if (searchField.activeFocus) searchField.focus = false
    root.controller.show()
    Qt.callLater(function() {
      if (root.opened) {
        setCenterHoverRevealSuppressed(true)
        keyCatcher.forceActiveFocus()
      }
      root.scrollToVerse()
    })
  }

  function close() {
    setCenterHoverRevealSuppressed(false)
    root.persist()
    if (searchField.activeFocus) searchField.focus = false
    root.controller.hide()
  }

  function toggle() {
    if (root.opened) root.close()
    else root.open()
  }

  function switchPanel(direction) {
    if (root.bar && typeof root.bar.switchPanelFrom === "function")
      return root.bar.switchPanelFrom(root.barIdentity, direction)
    return false
  }

  function setCenterHoverRevealSuppressed(value) {
    if (root.bar && typeof root.bar.setCenterHoverRevealSuppressed === "function")
      root.bar.setCenterHoverRevealSuppressed(value)
    else if (root.bar && "centerHoverRevealSuppressed" in root.bar)
      root.bar.centerHoverRevealSuppressed = value
  }

  function persist() {
    if (!root.stateReady) return
    stateFile.setText(Model.serializeState(root.book, root.chapter, root.verse))
  }

  function applyPlace(bookId, chapter, verse, persistNow) {
    if (!Canon.isValidPlace(bookId, chapter, 1)) return false
    root.book = bookId
    root.chapter = chapter
    root.verse = Model.clampVerse(root.bible, bookId, chapter, verse || 1)
    root.searchError = ""
    root.browseMode = "read"
    if (persistNow !== false) root.persist()
    Qt.callLater(root.scrollToVerse)
    return true
  }

  function stepChapter(delta) {
    var next = delta > 0
      ? Canon.nextChapter(root.book, root.chapter)
      : Canon.prevChapter(root.book, root.chapter)
    root.applyPlace(next.book, next.chapter, 1, true)
  }

  function submitSearch() {
    var parsed = Model.resolveReference(root.searchText, root.bible)
    if (!parsed) {
      root.searchError = "Not a known reference"
      return
    }
    if (!root.applyPlace(parsed.book, parsed.chapter, parsed.verse, true))
      root.searchError = "Not a known reference"
    else
      root.searchText = ""
  }

  function scrollToVerse() {
    if (!verseList.count) return
    var idx = Math.max(0, Math.min(verseList.count - 1, root.verse - 1))
    verseList.positionViewAtIndex(idx, ListView.Contain)
  }

  function openBooks(testament) {
    root.browseTestament = testament || root.browseTestament
    root.browseMode = "books"
  }

  function pickBook(id) {
    var place = Canon.bookSelectionPlace(id)
    if (!place) return
    root.book = place.book
    root.chapter = place.chapter
    root.verse = place.verse
    root.browseMode = "chapters"
  }

  function pickChapter(n) {
    root.applyPlace(root.book, n, 1, true)
  }

  FileView {
    id: bibleFile
    path: Model.fileUrlToPath(Qt.resolvedUrl("data/bsb.json"))
    printErrors: false
    onLoaded: {
      try { root.bible = JSON.parse(text()) } catch (e) { root.bible = null }
      stateFile.reload()
    }
  }

  FileView {
    id: stateFile
    path: Quickshell.env("HOME") + "/.local/state/omarchy/settings/canon.json"
    watchChanges: true
    atomicWrites: true
    printErrors: false
    onLoaded: {
      var place = Model.parseState(text(), root.bible)
      root.applyPlace(place.book, place.chapter, place.verse, false)
      root.stateReady = true
    }
    onLoadFailed: {
      root.applyPlace(Canon.DEFAULT_BOOK, Canon.DEFAULT_CHAPTER, Canon.DEFAULT_VERSE, false)
      root.stateReady = true
    }
    onFileChanged: reload()
  }

  KeyboardPanel {
    id: panel
    anchorItem: root.anchorItem
    owner: root.barIdentity
    bar: root.bar
    open: root.opened
    focusTarget: keyCatcher
    contentWidth: panel.fittedContentWidth(Style.space(380))
    contentHeight: panel.fittedContentHeight(Style.space(520))

    PanelKeyCatcher {
      id: keyCatcher
      anchors.fill: parent
      blocked: searchField.activeFocus
      onMoveRequested: function(dx, dy) {
        if (dx !== 0) root.stepChapter(dx)
        if (dy < 0) root.verse = Math.max(1, root.verse - 1)
        if (dy > 0) root.verse = Model.clampVerse(root.bible, root.book, root.chapter, root.verse + 1)
        if (dy !== 0) root.scrollToVerse()
      }
      onCloseRequested: root.close()
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onActivateRequested: {
        if (root.browseMode === "read") root.persist()
      }

      Column {
        id: content
        anchors.fill: parent
        spacing: Style.space(10)

        Item {
          width: parent.width
          height: headerRow.implicitHeight

          Row {
            id: headerRow
            anchors.left: parent.left
            anchors.right: parent.right
            spacing: Style.space(8)

            Button {
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰒮"
              foreground: contentForeground
              onClicked: root.stepChapter(-1)
            }

            Column {
              width: parent.width - Style.space(120)
              spacing: Style.space(2)
              anchors.verticalCenter: parent.verticalCenter

              Text {
                width: parent.width
                text: Canon.formatRef(root.book, root.chapter, 0, false)
                color: contentForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
                elide: Text.ElideRight
                horizontalAlignment: Text.AlignHCenter
              }

              Text {
                width: parent.width
                text: "BSB"
                color: mutedForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.caption
                horizontalAlignment: Text.AlignHCenter
              }
            }

            Button {
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰒭"
              foreground: contentForeground
              onClicked: root.stepChapter(1)
            }

            Button {
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰂻"
              foreground: root.browseMode === "read" ? mutedForeground : accentColor
              tooltipText: "Books"
              onClicked: {
                if (root.browseMode === "read") root.openBooks(root.currentBookInfo && root.currentBookInfo.testament === "nt" ? "nt" : "ot")
                else root.browseMode = "read"
              }
            }
          }
        }

        TextField {
          id: searchField
          width: parent.width
          placeholderText: "john 3:16"
          foreground: contentForeground
          font.family: contentFontFamily
          text: root.searchText
          onTextChanged: {
            root.searchText = text
            root.searchError = ""
          }
          Keys.onReturnPressed: root.submitSearch()
          Keys.onEnterPressed: root.submitSearch()
          Keys.onPressed: function(event) {
            if (event.key === Qt.Key_Escape) {
              event.accepted = true
              root.close()
            }
          }
        }

        Text {
          width: parent.width
          visible: root.searchError !== ""
          text: root.searchError
          color: root.bar ? root.bar.urgent : contentForeground
          font.family: contentFontFamily
          font.pixelSize: Style.font.caption
        }

        ListView {
          id: verseList
          width: parent.width
          height: parent.height - headerRow.height - searchField.height - browseToggle.height - Style.space(40)
          clip: true
          visible: root.browseMode === "read"
          spacing: Style.space(8)
          boundsBehavior: Flickable.StopAtBounds
          model: root.currentVerses

          delegate: Item {
            required property var modelData
            width: verseList.width
            height: verseText.implicitHeight

            Text {
              id: verseText
              width: parent.width
              text: modelData.n + "  " + modelData.text
              color: modelData.n === root.verse ? accentColor : (modelData.omitted ? mutedForeground : contentForeground)
              font.italic: modelData.omitted
              font.family: contentFontFamily
              font.pixelSize: Style.font.bodySmall
              wrapMode: Text.WordWrap
            }

            MouseArea {
              anchors.fill: parent
              cursorShape: Qt.PointingHandCursor
              onClicked: {
                root.verse = modelData.n
                root.persist()
              }
            }
          }
        }

        Column {
          width: parent.width
          visible: root.browseMode !== "read"
          spacing: Style.space(8)
          height: verseList.height

          Row {
            width: parent.width
            spacing: Style.space(6)
            visible: root.browseMode === "books"

            Button {
              width: (parent.width - parent.spacing) / 2
              text: "Old Testament"
              selected: root.browseTestament === "ot"
              bordered: true
              foreground: contentForeground
              onClicked: root.browseTestament = "ot"
            }

            Button {
              width: (parent.width - parent.spacing) / 2
              text: "New Testament"
              selected: root.browseTestament === "nt"
              bordered: true
              foreground: contentForeground
              onClicked: root.browseTestament = "nt"
            }
          }

          ListView {
            width: parent.width
            height: parent.height - (root.browseMode === "books" ? Style.space(40) : 0)
            clip: true
            visible: root.browseMode === "books"
            model: root.browseBooks
            boundsBehavior: Flickable.StopAtBounds
            delegate: Item {
              required property var modelData
              width: parent.width
              height: Style.space(28)

              Text {
                anchors.verticalCenter: parent.verticalCenter
                text: modelData.name
                color: modelData.id === root.book ? accentColor : contentForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.bodySmall
              }

              MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: root.pickBook(modelData.id)
              }
            }
          }

          GridView {
            width: parent.width
            height: parent.height
            visible: root.browseMode === "chapters"
            cellWidth: Style.space(40)
            cellHeight: Style.space(32)
            clip: true
            model: root.chapterTotal
            delegate: Item {
              required property int index
              width: Style.space(36)
              height: Style.space(28)

              Text {
                anchors.centerIn: parent
                text: index + 1
                color: (index + 1) === root.chapter ? accentColor : contentForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.bodySmall
              }

              MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                onClicked: root.pickChapter(index + 1)
              }
            }
          }
        }

        Item {
          id: browseToggle
          width: parent.width
          height: 1
        }
      }
    }
  }
}
