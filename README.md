# Canon

Berean Standard Bible reader for the Omarchy bar. Offline, no audio.

Plugin id: `andrewbacon.canon`.

## Install (this machine)

The live copy is:

```sh
omarchy plugin validate ~/.config/omarchy/plugins/andrewbacon.canon
omarchy plugin enable andrewbacon.canon --section right
```

From git later:

```sh
omarchy plugin add https://github.com/RamenPacket84/canon.git --enable
omarchy bar move andrewbacon.canon --section right
```

## Usage

- Left-click the bar chip to open or close the reader.
- Scroll the chip to move to the previous or next chapter.
- Type a reference or verse range (`jn 3:16`, `matt 6:9-13`, `psalm 23`, `1 john 1:1-4`) and press Enter to navigate and pre-select the range for reading or copying (`Ctrl+C`). Focus search anytime with `Ctrl+F` (or `/`).
- Navigate history using the **Back** (`󰌍`) and **Forward** (`󰌎`) header buttons, or shortcuts `Alt+Left` / `Alt+Right` to jump between previous searches and visited passages.
- Use the book button to browse Old/New Testament, then a chapter.
- Click a verse to select it, **Shift-click** to select a contiguous range, or **Ctrl-click** to toggle non-contiguous verses.
- Copy verses to clipboard with attribution (`"..."` / `— Reference`) using:
  - Keyboard shortcut `Ctrl+C` (or `c` / `y` when search is unfocused)
  - Hover copy button on each verse row
  - Right-click on any verse or active selection
- Bookmark passages using the hover bookmark button on each verse row or shortcut `b` / `Ctrl+B`. Saved verses appear in the **Bookmarks** drawer (`󰚌`).
- Use the settings button (`󰒓`) to choose your multi-verse copy format (**Numbered** `⁹ ... ¹⁰ ...`, **Paragraph**, or **Lines**).
- Escape clears active selection or closes the panel. The reading position and copy settings are saved to
  `~/.local/state/omarchy/settings/canon.json`.

## Remove

```sh
omarchy plugin remove andrewbacon.canon
```

Reading position in `canon.json` is left in place. This plugin is not a clock
clone; removing it does not touch `omarchy.clock`.
