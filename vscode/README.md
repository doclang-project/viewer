# DocLang Viewer for VS Code

Shows `.dclx` archives and `.dclg` markup in the DocLang viewer, with VS Code's own text editor for the markup.
The extension serves the standalone viewer from the repo root; `media/` is a build copy of it.

## Run

```bash
cd vscode
npm run sync   # copy the viewer into media/ (the launch config does this too)
```

Open this folder in VS Code and press F5; the Extension Development Host opens `../assets`.
Open `2501.17887.dclx`, then use the editor-title button *Open DocLang Markup to the Side*.

## How editing works

- **`.dclg`** is a custom *text* editor: the file is a normal VS Code document (undo, find, dirty state, save, diff, git)
  and the viewer is its live preview. Plain text editing stays available through *Reopen Editor With…*.
- **`.dclx`** opens in the viewer. *Open DocLang Markup to the Side* opens the archive's `document.xml` as a virtual
  text file (`doclang-archive:`); saving it writes the markup back into the archive, leaving every other entry untouched.
- The viewer updates as you type. While the XML is not well-formed it keeps showing the last good version.
- XSD validation runs in the extension host and shows up as squiggles and in the Problems panel.
- View preferences (pane layout, overlays, …) are stored in the extension's global state.
