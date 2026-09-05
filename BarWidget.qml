import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

BarWidget {
  id: root
  moduleName: "andrewbacon.canon"

  readonly property string barLabel: panelLoader.item && panelLoader.item.label
    ? panelLoader.item.label
    : "Canon"
  readonly property var verticalLines: root.vertical ? [root.barLabel] : []

  readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false
  readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false
  readonly property real openPanelIndicatorWidth: button.labelWidth
  readonly property real openPanelIndicatorHeight: Math.max(Style.space(10), Math.round(Style.bar.iconSlot * 0.55))

  // The panel is lazy-loaded on first use so the 3.9MB Bible can stay off
  // disk until the reader is actually opened. open()/toggle() load it on
  // demand and defer the open until the panel exists.
  property bool deferredOpen: false

  function open() {
    if (panelLoader.item) {
      panelLoader.item.open()
    } else {
      root.deferredOpen = true
      panelLoader.active = true
    }
  }

  function close() {
    if (panelLoader.item) panelLoader.item.close()
  }

  function toggle() {
    if (panelLoader.item) {
      panelLoader.item.toggle()
    } else {
      root.deferredOpen = true
      panelLoader.active = true
    }
  }

  function togglePanel() {
    root.toggle()
  }

  function closeForPopoutSwitch() {
    if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
  }

  function injectPanel() {
    var target = panelLoader.item
    if (!target) return
    if ("bar" in target) target.bar = root.bar
    if ("settings" in target) target.settings = root.settings
    if ("anchorItem" in target) target.anchorItem = button
    if ("hostWidget" in target) target.hostWidget = root
  }

  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  onBarChanged: injectPanel()
  onSettingsChanged: injectPanel()

  Loader {
    id: panelLoader
    active: false
    source: Qt.resolvedUrl("Panel.qml")
    visible: false
    onLoaded: {
      root.injectPanel()
      Qt.callLater(root.injectPanel)
      if (root.deferredOpen) {
        root.deferredOpen = false
        panelLoader.item.open()
      }
    }
  }

  IpcHandler {
    target: "andrewbacon.canon"

    function open(): void { root.open() }
    function close(): void { root.close() }
    function show(): void { root.open() }
    function hide(): void { root.close() }
    function toggle(): void { root.toggle() }
  }

  WidgetButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    text: root.vertical ? "" : root.barLabel
    labelVisible: !root.vertical
    hasVisualContent: root.vertical ? root.verticalLines.length > 0 : text !== ""
    fixedHeight: root.vertical ? root.verticalLines.length * Style.bar.iconSlot : -1
    horizontalMargin: 8.75
    verticalPadding: 8.75
    tooltipText: panelLoader.item ? panelLoader.item.tooltipLabel : "Canon"

    onPressed: function(b) {
      if (b === Qt.LeftButton) root.togglePanel()
    }

    onWheelMoved: function(delta) {
      if (!panelLoader.item) return
      if (delta > 0) panelLoader.item.stepChapter(-1)
      else panelLoader.item.stepChapter(1)
    }

    Column {
      visible: root.vertical
      anchors.fill: parent

      Repeater {
        model: root.verticalLines

        OpticalGlyph {
          required property string modelData
          width: button.width
          height: Style.bar.iconSlot
          text: modelData
          fontFamily: button.fontFamily
          fontSize: modelData.length > 3 ? button.fontSize * 0.9 : button.fontSize
          color: button.foreground
        }
      }
    }
  }
}
