// DocLang Viewer: hosts the standalone viewer (media/, synced from the repo root) in a custom editor.
const vscode = require("vscode");

const VIEW_TYPES = ["doclang.viewer", "doclang.viewer.markup"];
const PREFS_KEY = "doclang.viewerPrefs";

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const provider = new DocLangEditorProvider(context);
  for (const viewType of VIEW_TYPES) {
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(viewType, provider, {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: true,
      }),
    );
  }
}

function deactivate() {}

/** @implements {vscode.CustomReadonlyEditorProvider} */
class DocLangEditorProvider {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this.context = context;
    this.mediaRoot = vscode.Uri.joinPath(context.extensionUri, "media");
    this.template = null;
  }

  openCustomDocument(uri) {
    return { uri, dispose() {} };
  }

  async resolveCustomEditor(document, panel) {
    const { uri } = document;
    const name = uri.path.split("/").pop();
    const webview = panel.webview;
    webview.options = { enableScripts: true, localResourceRoots: [this.mediaRoot] };
    webview.html = await this.renderHtml(webview);

    /** Bytes last read from or written to disk, so our own saves don't echo back as external changes. */
    let known = null;
    const push = async () => {
      const bytes = await vscode.workspace.fs.readFile(uri);
      if (known && Buffer.compare(known, bytes) === 0) return;
      known = bytes;
      webview.postMessage({ type: "open", name, bytes });
    };

    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.joinPath(uri, ".."), name));
    watcher.onDidChange(() => push().catch(() => {}));

    const listener = webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "ready":
          await push().catch((err) => vscode.window.showErrorMessage(`Could not read ${name}: ${err.message}`));
          break;
        case "pref":
          await this.context.globalState.update(PREFS_KEY, { ...this.prefs(), [msg.key]: msg.value });
          break;
        case "save": {
          let error;
          try {
            known = Buffer.from(msg.bytes);
            await vscode.workspace.fs.writeFile(uri, known);
          } catch (err) {
            known = null;
            error = err.message;
          }
          webview.postMessage({ type: "saved", id: msg.id, error });
          break;
        }
      }
    });
    panel.onDidDispose(() => {
      watcher.dispose();
      listener.dispose();
    });
  }

  prefs() {
    return this.context.globalState.get(PREFS_KEY, {});
  }

  /** The viewer's index.html with a base URL, a CSP and the host bootstrap. */
  async renderHtml(webview) {
    this.template ??= Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.mediaRoot, "index.html"))).toString("utf8");
    const base = webview.asWebviewUri(this.mediaRoot).toString() + "/";
    const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const csp = [
      "default-src 'none'",
      `img-src ${webview.cspSource} blob: data:`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `script-src 'nonce-${nonce}' ${webview.cspSource} 'wasm-unsafe-eval'`,
      `worker-src blob: ${webview.cspSource}`,
      `connect-src ${webview.cspSource} blob:`,
    ].join("; ");
    const json = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
    const bootstrap = `<script nonce="${nonce}">${hostBootstrap(json(this.prefs()), json(base))}</script>`;
    const ready = `<script nonce="${nonce}">window.__doclangHostReady();</script>`;
    return this.template
      .replace("<head>", `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">\n  <base href="${base}">`)
      .replace(/\s*<link rel="manifest"[^>]*>/, "")
      .replace(/<script src="([^"]+)">/g, (_, src) => `<script nonce="${nonce}" src="${src}">`)
      .replace('<script nonce="' + nonce + '" src="demo-data.js">', `${bootstrap}\n  <script nonce="${nonce}" src="demo-data.js">`)
      .replace("</body>", `  ${ready}\n</body>`);
  }
}

/** Runs in the webview before viewer.js: defines DOCLANG_VIEWER_HOST and routes messages from the extension. */
function hostBootstrap(prefsJson, baseJson) {
  return `
const vscode = acquireVsCodeApi();
const base = ${baseJson};
const prefs = ${prefsJson};
const pendingSaves = new Map();
let saveSeq = 0;
window.DOCLANG_VIEWER_HOST = {
  demo: false,
  embedded: true,
  storage: {
    getItem: (key) => prefs[key] ?? null,
    setItem: (key, value) => {
      prefs[key] = value;
      vscode.postMessage({ type: "pref", key, value });
    },
  },
  // Module workers must come from the page's origin, so start a blob worker that imports the real one.
  createValidatorWorker: () => {
    const source = 'import ' + JSON.stringify(base + 'validator-worker.mjs') + ';';
    const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    return new Worker(url, { type: 'module' });
  },
  saveFile: (name, buffer) => new Promise((resolve, reject) => {
    const id = ++saveSeq;
    pendingSaves.set(id, { resolve, reject });
    vscode.postMessage({ type: 'save', id, name, bytes: new Uint8Array(buffer) });
  }),
};
window.addEventListener('message', ({ data }) => {
  if (data.type === 'open') {
    const b = data.bytes;
    const buffer = b instanceof ArrayBuffer ? b : b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    window.DocLangViewer.open(data.name, buffer);
  } else if (data.type === 'saved') {
    const pending = pendingSaves.get(data.id);
    pendingSaves.delete(data.id);
    if (data.error) pending?.reject(new Error(data.error)); else pending?.resolve();
  }
});
window.__doclangHostReady = () => vscode.postMessage({ type: 'ready' });
`;
}

module.exports = { activate, deactivate };
