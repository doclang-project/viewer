// A virtual text file for the document.xml of a .dclx, so VS Code's own text editor can edit it:
// reading extracts it from the archive, saving writes it back into the archive.
const vscode = require("vscode");
const { readDocument, replaceDocument } = require("./archive");

const SCHEME = "doclang-archive";

/** doclang-archive:/<name>.dclx.xml?<archive uri>, a name that is unambiguous in the tab bar. */
function virtualUri(archiveUri) {
  const name = archiveUri.path.split("/").pop();
  return vscode.Uri.from({ scheme: SCHEME, path: `/${name}.xml`, query: encodeURIComponent(archiveUri.toString()) });
}

function archiveUri(virtual) {
  return vscode.Uri.parse(decodeURIComponent(virtual.query));
}

/** @implements {vscode.FileSystemProvider} */
class ArchiveDocumentFs {
  constructor() {
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeFile = this._emitter.event;
  }

  watch(uri) {
    const file = archiveUri(uri);
    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.joinPath(file, ".."), file.path.split("/").pop()));
    const changed = () => this._emitter.fire([{ type: vscode.FileChangeType.Changed, uri }]);
    watcher.onDidChange(changed);
    watcher.onDidCreate(changed);
    return watcher;
  }

  async stat(uri) {
    const [stat, xml] = await Promise.all([vscode.workspace.fs.stat(archiveUri(uri)), this.readFile(uri)]);
    return { type: vscode.FileType.File, ctime: stat.ctime, mtime: stat.mtime, size: xml.length };
  }

  async readFile(uri) {
    return readDocument(Buffer.from(await vscode.workspace.fs.readFile(archiveUri(uri))));
  }

  async writeFile(uri, content) {
    const file = archiveUri(uri);
    const zip = Buffer.from(await vscode.workspace.fs.readFile(file));
    await vscode.workspace.fs.writeFile(file, replaceDocument(zip, content));
  }

  readDirectory() {
    throw vscode.FileSystemError.NoPermissions();
  }
  createDirectory() {
    throw vscode.FileSystemError.NoPermissions();
  }
  delete() {
    throw vscode.FileSystemError.NoPermissions();
  }
  rename() {
    throw vscode.FileSystemError.NoPermissions();
  }
}

module.exports = { SCHEME, ArchiveDocumentFs, virtualUri, archiveUri };
