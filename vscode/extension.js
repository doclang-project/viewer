// DocLang Viewer: hosts the standalone viewer (media/, synced from the repo root) next to VS Code's own text editor.
//  - .dclg: a custom *text* editor, so the file is a normal TextDocument and the viewer is its live preview.
//  - .dclx: a viewer for the archive; its document.xml is edited as a virtual text file (see archiveFs.js).
const vscode = require("vscode");
const { SCHEME, ArchiveDocumentFs, virtualUri } = require("./archiveFs");
const { readDocument, replaceDocument, assetsFingerprint } = require("./archive");
const { ViewerShell } = require("./shell");

const ARCHIVE_VIEW_TYPE = "doclang.viewer";
const MARKUP_VIEW_TYPE = "doclang.viewer.markup";

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const shell = new ViewerShell(context);
  const options = { webviewOptions: { retainContextWhenHidden: true }, supportsMultipleEditorsPerDocument: true };

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(SCHEME, new ArchiveDocumentFs(), { isCaseSensitive: true }),
    vscode.window.registerCustomEditorProvider(ARCHIVE_VIEW_TYPE, new ArchiveEditorProvider(shell), options),
    vscode.window.registerCustomEditorProvider(MARKUP_VIEW_TYPE, new MarkupEditorProvider(shell), options),
    vscode.commands.registerCommand("doclang.openSource", openSource),
  );
}

function deactivate() {}

/** Open the markup of the active DocLang viewer in a text editor beside it. */
async function openSource(uri) {
  const target = uri ?? vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri;
  if (!target) return;
  const isArchive = /\.dclx$/i.test(target.path);
  const sourceUri = isArchive ? virtualUri(target) : target;
  await vscode.window.showTextDocument(sourceUri, {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: true,
    preview: false,
  });
}

/** @implements {vscode.CustomTextEditorProvider} */
class MarkupEditorProvider {
  /** @param {ViewerShell} shell */
  constructor(shell) {
    this.shell = shell;
  }

  async resolveCustomTextEditor(document, panel) {
    await this.shell.mount(panel, {
      name: document.uri.path.split("/").pop(),
      textUri: document.uri,
      getText: () => document.getText(),
      versionKey: async (text) => text,
      buildBytes: async (text) => Buffer.from(text, "utf8"),
      subscribe: (trigger) => vscode.workspace.onDidChangeTextDocument((e) => e.document === document && trigger()),
    });
  }
}

/** @implements {vscode.CustomReadonlyEditorProvider} */
class ArchiveEditorProvider {
  /** @param {ViewerShell} shell */
  constructor(shell) {
    this.shell = shell;
  }

  openCustomDocument(uri) {
    return { uri, dispose() {} };
  }

  async resolveCustomEditor(document, panel) {
    const { uri } = document;
    const textDocument = await vscode.workspace.openTextDocument(virtualUri(uri));
    /** The archive as it is on disk, read again whenever it changes. */
    let archive = null;
    const diskArchive = async () => (archive ??= Buffer.from(await vscode.workspace.fs.readFile(uri)));

    await this.shell.mount(panel, {
      name: uri.path.split("/").pop(),
      textUri: textDocument.uri,
      getText: () => textDocument.getText(),
      // Saving the markup rewrites the archive, but what the viewer shows only changes with the markup or the assets.
      versionKey: async (text) => `${assetsFingerprint(await diskArchive())}\0${text}`,
      // The viewer opens the archive with the markup as edited, saved or not.
      buildBytes: async (text) => {
        const zip = await diskArchive();
        return text === readDocument(zip).toString("utf8") ? zip : replaceDocument(zip, Buffer.from(text, "utf8"));
      },
      subscribe: (trigger) => {
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.joinPath(uri, ".."), uri.path.split("/").pop()));
        const onDisk = () => {
          archive = null;
          trigger();
        };
        return vscode.Disposable.from(
          watcher,
          watcher.onDidChange(onDisk),
          watcher.onDidCreate(onDisk),
          vscode.workspace.onDidChangeTextDocument((e) => e.document === textDocument && trigger()),
        );
      },
    });
  }
}

module.exports = { activate, deactivate };
