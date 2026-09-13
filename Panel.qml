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
  property var settings: null

  property var bible: null
  property string book: Canon.DEFAULT_BOOK
  property int chapter: Canon.DEFAULT_CHAPTER
  property int verse: Canon.DEFAULT_VERSE
  property var selectedVerses: [root.verse]
  property int selectionAnchor: root.verse
  readonly property bool hasMultiSelection: selectedVerses && selectedVerses.length > 1
  property string copyFormat: Model.DEFAULT_COPY_FORMAT
  property string copyNotice: ""
  property string searchText: ""
  property string searchError: ""
  property string browseMode: "read" // read | books | chapters | settings
  property string browseTestament: "ot"
  property bool stateReady: false

  property var navHistory: []
  property int navIndex: -1
  property bool _isNavigatingHistory: false

  readonly property bool canGoBack: navIndex > 0
  readonly property bool canGoForward: navIndex >= 0 && navIndex < (navHistory ? navHistory.length - 1 : 0)

  readonly property string historyBackLabel: {
    if (!root.canGoBack || !root.navHistory || !root.navHistory[root.navIndex - 1]) return ""
    var prev = root.navHistory[root.navIndex - 1]
    return Canon.formatRefList(prev.book, prev.chapter, prev.selectedVerses, false)
  }

  readonly property string historyForwardLabel: {
    if (!root.canGoForward || !root.navHistory || !root.navHistory[root.navIndex + 1]) return ""
    var next = root.navHistory[root.navIndex + 1]
    return Canon.formatRefList(next.book, next.chapter, next.selectedVerses, false)
  }

  function pushHistory(bookId, chapter, verse, selectedVerses) {
    if (root._isNavigatingHistory) return
    var res = Model.pushHistory(root.navHistory, root.navIndex, {
      book: bookId,
      chapter: chapter,
      verse: verse,
      selectedVerses: selectedVerses
    }, 50)
    root.navHistory = res.history
    root.navIndex = res.index
  }

  function updateCurrentHistoryEntry() {
    if (root._isNavigatingHistory || root.navIndex < 0) return
    root.navHistory = Model.updateCurrentHistory(root.navHistory, root.navIndex, root.verse, root.selectedVerses)
  }

  function goBack() {
    if (!root.canGoBack) return false
    root._isNavigatingHistory = true
    root.navIndex--
    var entry = root.navHistory[root.navIndex]
    root.applyPlace(entry.book, entry.chapter, entry.verse, true, null, entry.selectedVerses)
    root._isNavigatingHistory = false
    return true
  }

  function goForward() {
    if (!root.canGoForward) return false
    root._isNavigatingHistory = true
    root.navIndex++
    var entry = root.navHistory[root.navIndex]
    root.applyPlace(entry.book, entry.chapter, entry.verse, true, null, entry.selectedVerses)
    root._isNavigatingHistory = false
    return true
  }

  function isVerseSelected(n) {
    return root.selectedVerses && root.selectedVerses.indexOf(n) !== -1
  }

  function selectOnly(n) {
    var v = Model.clampVerse(root.bible, root.book, root.chapter, n)
    root.selectedVerses = [v]
    root.selectionAnchor = v
    root.verse = v
    root.updateCurrentHistoryEntry()
  }

  function toggleVerse(n) {
    var v = Model.clampVerse(root.bible, root.book, root.chapter, n)
    var list = root.selectedVerses ? root.selectedVerses.slice() : []
    var idx = list.indexOf(v)
    if (idx !== -1) {
      if (list.length > 1) {
        list.splice(idx, 1)
        root.verse = list[list.length - 1]
      }
    } else {
      list.push(v)
      list.sort(function(a, b) { return a - b })
      root.verse = v
    }
    root.selectedVerses = list
    root.selectionAnchor = v
    root.updateCurrentHistoryEntry()
  }

  function selectRange(n) {
    var target = Model.clampVerse(root.bible, root.book, root.chapter, n)
    var anchor = root.selectionAnchor || root.verse
    var s = Math.min(anchor, target)
    var e = Math.max(anchor, target)
    var list = []
    for (var i = s; i <= e; i++) list.push(i)
    root.selectedVerses = list
    root.verse = target
    root.updateCurrentHistoryEntry()
  }

  onSettingsChanged: {
    if (root.settings && typeof root.settings.copyFormat === "string") {
      root.copyFormat = root.settings.copyFormat
    }
  }

  readonly property color contentForeground: bar ? bar.foreground : Color.foreground
  readonly property color mutedForeground: Color.muted
  readonly property color accentColor: Color.accent
  readonly property string contentFontFamily: bar ? bar.fontFamily : Style.font.family

  readonly property var currentVerses: Model.versesFor(root.bible, root.book, root.chapter)
  readonly property string label: root.hasMultiSelection
    ? Canon.formatRefList(root.book, root.chapter, root.selectedVerses, true)
    : Canon.formatRef(root.book, root.chapter, root.verse, true)
  readonly property string tooltipLabel: (root.hasMultiSelection
    ? Canon.formatRefList(root.book, root.chapter, root.selectedVerses, false)
    : Canon.formatRef(root.book, root.chapter, root.verse, false)) + " · BSB"
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
    stateFile.setText(Model.serializeState(root.book, root.chapter, root.verse, root.copyFormat))
  }

  function applyPlace(bookId, chapter, verse, persistNow, endVerse, selectedVersesList) {
    if (!Canon.isValidPlace(bookId, chapter, 1)) return false
    root.book = bookId
    root.chapter = chapter
    var startV = Model.clampVerse(root.bible, bookId, chapter, verse || 1)
    root.verse = startV
    if (Array.isArray(selectedVersesList) && selectedVersesList.length > 0) {
      var validList = []
      for (var k = 0; k < selectedVersesList.length; k++) {
        var cv = Model.clampVerse(root.bible, bookId, chapter, selectedVersesList[k])
        if (validList.indexOf(cv) === -1) validList.push(cv)
      }
      validList.sort(function(a, b) { return a - b })
      root.selectedVerses = validList
      root.selectionAnchor = validList[0] || startV
      root.verse = startV
    } else if (typeof endVerse === "number" && endVerse >= 1 && endVerse !== startV) {
      var endV = Model.clampVerse(root.bible, bookId, chapter, endVerse)
      var s = Math.min(startV, endV)
      var e = Math.max(startV, endV)
      var list = []
      for (var i = s; i <= e; i++) list.push(i)
      root.selectedVerses = list
      root.selectionAnchor = s
      root.verse = s
    } else {
      root.selectedVerses = [startV]
      root.selectionAnchor = startV
    }
    root.searchError = ""
    root.browseMode = "read"
    if (!root._isNavigatingHistory) {
      root.pushHistory(root.book, root.chapter, root.verse, root.selectedVerses)
    }
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
    if (!root.applyPlace(parsed.book, parsed.chapter, parsed.verse, true, parsed.endVerse)) {
      root.searchError = "Not a known reference"
    } else {
      root.searchText = ""
      searchField.focus = false
      keyCatcher.forceActiveFocus()
    }
  }

  function scrollToVerse() {
    if (!verseList.count) return
    var idx = Math.max(0, Math.min(verseList.count - 1, root.verse - 1))
    verseList.positionViewAtIndex(idx, ListView.Contain)
  }

  function copySelection(versesList) {
    var list = Array.isArray(versesList) && versesList.length > 0
      ? versesList
      : (root.selectedVerses && root.selectedVerses.length > 0 ? root.selectedVerses : [root.verse])
    var text = Model.formatCopiedVerses(root.bible, root.book, root.chapter, list, null, root.copyFormat)
    if (!text) return false

    try {
      if (typeof Quickshell !== "undefined") {
        Quickshell.clipboardText = text
        Quickshell.execDetached(["wl-copy", "--", text])
      }
    } catch (e1) {}

    try {
      clipboardProxy.text = text
      clipboardProxy.selectAll()
      clipboardProxy.copy()
      clipboardProxy.deselect()
    } catch (e2) {}

    var ref = Canon.formatRefList(root.book, root.chapter, list, false)
    root.showCopyNotice("Copied " + ref)
    return true
  }

  function showCopyNotice(msg) {
    root.copyNotice = msg
    copyNoticeTimer.restart()
  }

  TextEdit {
    id: clipboardProxy
    visible: false
    readOnly: true
  }

  Timer {
    id: copyNoticeTimer
    interval: 1800
    repeat: false
    onTriggered: root.copyNotice = ""
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
      if (root.settings && typeof root.settings.copyFormat === "string") {
        root.copyFormat = root.settings.copyFormat
      } else {
        root.copyFormat = place.copyFormat || Model.DEFAULT_COPY_FORMAT
      }
      root.applyPlace(place.book, place.chapter, place.verse, false)
      root.stateReady = true
    }
    onLoadFailed: {
      if (root.settings && typeof root.settings.copyFormat === "string") {
        root.copyFormat = root.settings.copyFormat
      } else {
        root.copyFormat = Model.DEFAULT_COPY_FORMAT
      }
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
      Keys.onPressed: function(event) {
        if ((event.modifiers & Qt.AltModifier) && event.key === Qt.Key_Left) {
          if (root.goBack()) {
            event.accepted = true
            return
          }
        }
        if ((event.modifiers & Qt.AltModifier) && event.key === Qt.Key_Right) {
          if (root.goForward()) {
            event.accepted = true
            return
          }
        }
        if ((event.modifiers & Qt.ControlModifier) && (event.key === Qt.Key_C || event.key === Qt.Key_Insert)) {
          root.copySelection()
          event.accepted = true
          return
        }
        if (event.key === Qt.Key_C || event.key === Qt.Key_Y) {
          root.copySelection()
          event.accepted = true
          return
        }
        if (event.modifiers & Qt.ShiftModifier) {
          if (event.key === Qt.Key_Down || event.text === "J") {
            var nextV = Model.clampVerse(root.bible, root.book, root.chapter, root.verse + 1)
            root.selectRange(nextV)
            root.scrollToVerse()
            event.accepted = true
            return
          } else if (event.key === Qt.Key_Up || event.text === "K") {
            var prevV = Math.max(1, root.verse - 1)
            root.selectRange(prevV)
            root.scrollToVerse()
            event.accepted = true
            return
          }
        }
      }
      onMoveRequested: function(dx, dy) {
        if (dx !== 0) root.stepChapter(dx)
        if (dy < 0) {
          root.selectOnly(Math.max(1, root.verse - 1))
        }
        if (dy > 0) {
          root.selectOnly(Model.clampVerse(root.bible, root.book, root.chapter, root.verse + 1))
        }
        if (dy !== 0) root.scrollToVerse()
      }
      onCloseRequested: {
        if (root.browseMode !== "read") {
          root.browseMode = "read"
        } else if (root.hasMultiSelection) {
          root.selectOnly(root.verse)
        } else {
          root.close()
        }
      }
      onTabRequested: function(direction) { root.switchPanel(direction) }
      onActivateRequested: {
        if (root.browseMode === "read") {
          root.copySelection()
          root.persist()
        }
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
            spacing: Style.space(6)

            Button {
              id: backBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰌍"
              foreground: root.canGoBack ? contentForeground : mutedForeground
              opacity: root.canGoBack ? 1.0 : 0.35
              enabled: root.canGoBack
              tooltipText: root.canGoBack
                ? (root.historyBackLabel ? "Back to " + root.historyBackLabel + " (Alt+Left)" : "Back (Alt+Left)")
                : "Back (Alt+Left)"
              onClicked: root.goBack()
            }

            Button {
              id: fwdBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰌎"
              foreground: root.canGoForward ? contentForeground : mutedForeground
              opacity: root.canGoForward ? 1.0 : 0.35
              enabled: root.canGoForward
              tooltipText: root.canGoForward
                ? (root.historyForwardLabel ? "Forward to " + root.historyForwardLabel + " (Alt+Right)" : "Forward (Alt+Right)")
                : "Forward (Alt+Right)"
              onClicked: root.goForward()
            }

            Button {
              id: prevBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰒮"
              foreground: contentForeground
              tooltipText: "Previous chapter"
              onClicked: root.stepChapter(-1)
            }

            Column {
              id: titleCol
              width: Math.max(Style.space(70), headerRow.width
                - (backBtn.width + fwdBtn.width + prevBtn.width + nextBtn.width + copyBtn.width + booksBtn.width + settingsBtn.width)
                - (headerRow.spacing * 7))
              spacing: Style.space(2)
              anchors.verticalCenter: parent.verticalCenter

              Text {
                width: parent.width
                text: root.browseMode === "settings"
                  ? "Settings"
                  : (root.browseMode === "books" ? "Select Book" : (root.browseMode === "chapters" ? root.book : Canon.formatRef(root.book, root.chapter, 0, false)))
                color: contentForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.subtitle
                font.bold: true
                elide: Text.ElideRight
                horizontalAlignment: Text.AlignHCenter
              }

              Text {
                width: parent.width
                text: root.browseMode === "settings" ? "Canon" : "BSB"
                color: mutedForeground
                font.family: contentFontFamily
                font.pixelSize: Style.font.caption
                horizontalAlignment: Text.AlignHCenter
              }
            }

            Button {
              id: nextBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰒭"
              foreground: contentForeground
              tooltipText: "Next chapter"
              onClicked: root.stepChapter(1)
            }

            Button {
              id: copyBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰆏"
              foreground: root.hasMultiSelection ? accentColor : contentForeground
              tooltipText: root.hasMultiSelection
                ? "Copy " + Canon.formatRefList(root.book, root.chapter, root.selectedVerses, false) + " (Ctrl+C)"
                : "Copy " + Canon.formatRef(root.book, root.chapter, root.verse, false) + " (Ctrl+C)"
              onClicked: root.copySelection()
            }

            Button {
              id: booksBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰂻"
              foreground: (root.browseMode === "books" || root.browseMode === "chapters") ? accentColor : mutedForeground
              tooltipText: "Books"
              onClicked: {
                if (root.browseMode === "books" || root.browseMode === "chapters") root.browseMode = "read"
                else root.openBooks(root.currentBookInfo && root.currentBookInfo.testament === "nt" ? "nt" : "ot")
              }
            }

            Button {
              id: settingsBtn
              width: Style.space(28)
              implicitHeight: Style.space(28)
              horizontalPadding: 0
              verticalPadding: 0
              iconText: "󰒓"
              foreground: root.browseMode === "settings" ? accentColor : mutedForeground
              tooltipText: "Settings"
              onClicked: {
                if (root.browseMode === "settings") root.browseMode = "read"
                else root.browseMode = "settings"
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
            } else if ((event.modifiers & Qt.AltModifier) && event.key === Qt.Key_Left) {
              if (root.goBack()) {
                event.accepted = true
                searchField.focus = false
                keyCatcher.forceActiveFocus()
              }
            } else if ((event.modifiers & Qt.AltModifier) && event.key === Qt.Key_Right) {
              if (root.goForward()) {
                event.accepted = true
                searchField.focus = false
                keyCatcher.forceActiveFocus()
              }
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
          spacing: Style.space(4)
          boundsBehavior: Flickable.StopAtBounds
          model: root.currentVerses

          delegate: Rectangle {
            id: verseRow
            required property var modelData
            required property int index

            readonly property bool isSelected: root.isVerseSelected(modelData.n)
            readonly property bool isCurrent: modelData.n === root.verse

            width: verseList.width
            implicitHeight: rowContent.implicitHeight + Style.space(6)
            radius: Style.space(4)
            color: isSelected
              ? Qt.rgba(root.accentColor.r, root.accentColor.g, root.accentColor.b, 0.15)
              : (verseMouse.containsMouse ? Qt.rgba(root.contentForeground.r, root.contentForeground.g, root.contentForeground.b, 0.05) : "transparent")
            border.width: isCurrent ? 1 : 0
            border.color: Qt.rgba(root.accentColor.r, root.accentColor.g, root.accentColor.b, 0.5)

            Row {
              id: rowContent
              anchors.left: parent.left
              anchors.right: parent.right
              anchors.margins: Style.space(4)
              anchors.verticalCenter: parent.verticalCenter
              spacing: Style.space(4)

              Text {
                id: verseText
                width: parent.width - (verseMouse.containsMouse || isSelected ? Style.space(28) : 0)
                text: modelData.n + "  " + modelData.text
                color: isSelected ? root.accentColor : (modelData.omitted ? mutedForeground : contentForeground)
                font.italic: modelData.omitted
                font.family: contentFontFamily
                font.pixelSize: Style.font.bodySmall
                wrapMode: Text.WordWrap
              }

              Button {
                width: Style.space(24)
                implicitHeight: Style.space(24)
                anchors.verticalCenter: parent.verticalCenter
                visible: verseMouse.containsMouse || (isSelected && root.hasMultiSelection)
                horizontalPadding: 0
                verticalPadding: 0
                iconText: "󰆏"
                foreground: isSelected ? root.accentColor : contentForeground
                tooltipText: isSelected && root.hasMultiSelection
                  ? "Copy selected verses"
                  : "Copy verse " + modelData.n
                onClicked: {
                  if (isSelected && root.hasMultiSelection) {
                    root.copySelection()
                  } else {
                    root.copySelection([modelData.n])
                  }
                }
              }
            }

            MouseArea {
              id: verseMouse
              anchors.fill: parent
              hoverEnabled: true
              cursorShape: Qt.PointingHandCursor
              acceptedButtons: Qt.LeftButton | Qt.RightButton

              onClicked: function(mouse) {
                if (mouse.button === Qt.RightButton) {
                  if (isSelected && root.hasMultiSelection) {
                    root.copySelection()
                  } else {
                    root.selectOnly(modelData.n)
                    root.copySelection([modelData.n])
                  }
                  return
                }

                if (mouse.modifiers & Qt.ControlModifier) {
                  root.toggleVerse(modelData.n)
                } else if (mouse.modifiers & Qt.ShiftModifier) {
                  root.selectRange(modelData.n)
                } else {
                  root.selectOnly(modelData.n)
                  root.persist()
                }
              }
            }
          }
        }

        Column {
          width: parent.width
          visible: root.browseMode === "books" || root.browseMode === "chapters"
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

        Column {
          width: parent.width
          visible: root.browseMode === "settings"
          spacing: Style.space(12)
          height: verseList.height

          Text {
            text: "Multi-Verse Copy Format"
            color: contentForeground
            font.family: contentFontFamily
            font.pixelSize: Style.font.bodySmall
            font.bold: true
          }

          Text {
            width: parent.width
            text: "Select how multiple verses in a selection are formatted inside quotation marks:"
            color: mutedForeground
            font.family: contentFontFamily
            font.pixelSize: Style.font.caption
            wrapMode: Text.WordWrap
          }

          Row {
            width: parent.width
            spacing: Style.space(6)

            Button {
              width: (parent.width - Style.space(12)) / 3
              text: "Numbered"
              selected: root.copyFormat === "numbered"
              bordered: true
              foreground: contentForeground
              onClicked: {
                root.copyFormat = "numbered"
                root.persist()
              }
            }

            Button {
              width: (parent.width - Style.space(12)) / 3
              text: "Paragraph"
              selected: root.copyFormat === "paragraph"
              bordered: true
              foreground: contentForeground
              onClicked: {
                root.copyFormat = "paragraph"
                root.persist()
              }
            }

            Button {
              width: (parent.width - Style.space(12)) / 3
              text: "Lines"
              selected: root.copyFormat === "lines"
              bordered: true
              foreground: contentForeground
              onClicked: {
                root.copyFormat = "lines"
                root.persist()
              }
            }
          }

          Rectangle {
            width: parent.width
            height: Style.space(90)
            radius: Style.space(4)
            color: Qt.rgba(contentForeground.r, contentForeground.g, contentForeground.b, 0.04)
            border.width: 1
            border.color: Qt.rgba(contentForeground.r, contentForeground.g, contentForeground.b, 0.12)

            Text {
              anchors.fill: parent
              anchors.margins: Style.space(8)
              text: root.copyFormat === "numbered"
                ? "\"⁹ So then, this is how you should pray: ... ¹³ And lead us not into temptation...\"\n— Matthew 6:9-13"
                : (root.copyFormat === "paragraph"
                   ? "\"So then, this is how you should pray: ... And lead us not into temptation...\"\n— Matthew 6:9-13"
                   : "\"⁹ So then, this is how you should pray: ...\n¹⁰ ...\n¹³ And lead us not into temptation...\"\n— Matthew 6:9-13")
              color: mutedForeground
              font.family: contentFontFamily
              font.pixelSize: Style.font.caption
              wrapMode: Text.WordWrap
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

    Rectangle {
      id: copyNoticePill
      anchors.horizontalCenter: parent.horizontalCenter
      anchors.bottom: parent.bottom
      anchors.bottomMargin: Style.space(14)
      z: 1000
      visible: root.copyNotice !== ""
      opacity: visible ? 1.0 : 0.0
      Behavior on opacity { NumberAnimation { duration: 150 } }
      width: Math.min(parent.width - Style.space(32), noticeRow.implicitWidth + Style.space(20))
      height: Style.space(30)
      radius: Style.space(15)
      color: bar ? bar.background : Color.background
      border.width: 1
      border.color: root.accentColor

      Row {
        id: noticeRow
        anchors.centerIn: parent
        spacing: Style.space(6)
        Text {
          text: "󰄬"
          color: root.accentColor
          font.family: contentFontFamily
          font.pixelSize: Style.font.caption
          anchors.verticalCenter: parent.verticalCenter
        }
        Text {
          text: root.copyNotice
          color: contentForeground
          font.family: contentFontFamily
          font.pixelSize: Style.font.caption
          font.bold: true
          elide: Text.ElideRight
          anchors.verticalCenter: parent.verticalCenter
        }
      }
    }
  }
}
