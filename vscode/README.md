# DocLang Viewer for VS Code

Opens `.dclx` archives (and, via *Reopen Editor With…*, `.dclg` markup) in the DocLang viewer.
The extension serves the standalone viewer from the repo root; `media/` is a build copy of it.

## Run

```bash
cd vscode
npm run sync   # copy the viewer into media/ (the launch config does this too)
```

Open this folder in VS Code and press F5; the Extension Development Host opens `../assets` — open `2501.17887.dclx`.

## Notes

- Edits made in the viewer are saved to the file through the extension (viewer's Save button).
- External changes to the file are pushed into the open viewer; unsaved viewer edits are replaced.
- View preferences (pane layout, overlays, …) are stored in the extension's global state.
