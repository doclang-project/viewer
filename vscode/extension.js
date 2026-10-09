// DocLang Viewer: hosts the standalone viewer (media/, synced from the repo root) in a custom editor.
const vscode = require("vscode");
const { pathToFileURL } = require("node:url");

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
    this.validator = null;
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
      webview.postMessage({ type: "open", name, data: Buffer.from(bytes).toString("base64") });
    };

    const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.joinPath(uri, ".."), name));
    watcher.onDidChange(() => push().catch(() => {}));

    const listener = webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "ready":
          await push().catch((err) => vscode.window.showErrorMessage(`Could not read ${name}: ${err.message}`));
          break;
        case "error":
          vscode.window.showErrorMessage(`DocLang Viewer: ${msg.message}`);
          break;
        case "validate": {
          try {
            webview.postMessage({ type: "validated", id: msg.id, result: await this.validate(msg.markup) });
          } catch (err) {
            webview.postMessage({ type: "validated", id: msg.id, error: String(err?.message ?? err) });
          }
          break;
        }
        case "pref":
          await this.context.globalState.update(PREFS_KEY, { ...this.prefs(), [msg.key]: msg.value });
          break;
        case "save": {
          let error;
          try {
            known = Buffer.from(msg.data, "base64");
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

  /** XSD validation with the viewer's own validator (libxml2 compiled to WASM), loaded on first use. */
  async validate(markup) {
    this.validator ??= import(pathToFileURL(vscode.Uri.joinPath(this.mediaRoot, "validator-core.mjs").fsPath).href);
    const { validate } = await this.validator;
    const schema = vscode.Uri.joinPath(this.mediaRoot, "schema", "doclang.xsd");
    return validate(markup, () => vscode.workspace.fs.readFile(schema));
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
const pendingRequests = new Map();
let requestSeq = 0;
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
  // Validation runs in the extension host: webviews cannot start module workers from their resource origin.
  validate: (markup) => new Promise((resolve, reject) => {
    const id = ++requestSeq;
    pendingRequests.set(id, { resolve, reject });
    vscode.postMessage({ type: 'validate', id, markup });
  }),
  saveFile: (name, buffer) => new Promise((resolve, reject) => {
    const id = ++requestSeq;
    pendingRequests.set(id, { resolve, reject });
    vscode.postMessage({ type: 'save', id, name, data: toBase64(new Uint8Array(buffer)) });
  }),
};
// Bytes travel as base64: structured typed-array support in webview messaging varies by VS Code version.
function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
const reportError = (err) => vscode.postMessage({ type: 'error', message: String(err?.stack ?? err?.message ?? err) });
window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
window.addEventListener('message', ({ data }) => {
  if (data.type === 'open') {
    const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
    window.DocLangViewer.open(data.name, bytes.buffer).catch(reportError);
  } else if (data.type === 'saved' || data.type === 'validated') {
    const pending = pendingRequests.get(data.id);
    pendingRequests.delete(data.id);
    if (data.error) pending?.reject(new Error(data.error)); else pending?.resolve(data.result);
  }
});
window.__doclangHostReady = () => vscode.postMessage({ type: 'ready' });
`;
}

module.exports = { activate, deactivate };
