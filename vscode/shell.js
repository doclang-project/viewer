// The viewer webview: its HTML, the message bridge, live updates and schema diagnostics.
const vscode = require("vscode");
const { pathToFileURL } = require("node:url");

const PREFS_KEY = "doclang.viewerPrefs";
const UPDATE_DELAY_MS = 250;

class ViewerShell {
  /** @param {vscode.ExtensionContext} context */
  constructor(context) {
    this.context = context;
    this.mediaRoot = vscode.Uri.joinPath(context.extensionUri, "media");
    this.template = null;
    this.validator = null;
    this.diagnostics = vscode.languages.createDiagnosticCollection("doclang");
    context.subscriptions.push(this.diagnostics);
  }

  /**
   * Show a document in `panel` and keep it up to date.
   * @param {vscode.WebviewPanel} panel
   * @param {{
   *   name: string,
   *   textUri: vscode.Uri,
   *   getText: () => string,
   *   versionKey: (text: string) => Promise<string>,
   *   buildBytes: (text: string) => Promise<Uint8Array>,
   *   subscribe: (trigger: () => void) => vscode.Disposable,
   * }} source `getText` is the markup as currently edited; `versionKey` identifies what the viewer would show
   *   (an unchanged key means nothing to send), and `buildBytes` makes what it opens
   */
  async mount(panel, source) {
    const { webview } = panel;
    webview.options = { enableScripts: true, localResourceRoots: [this.mediaRoot] };
    webview.html = await this.renderHtml(webview);

    let lastKey = null;
    let first = true;
    let timer;
    const refresh = async () => {
      const text = source.getText();
      const result = await this.check(text, source.textUri);
      // Half-typed XML must not blank the viewer: keep showing the last good version until it parses.
      if (!first && result.issues.some((issue) => issue.kind === "parse")) return;
      const key = await source.versionKey(text);
      if (key === lastKey) return;
      lastKey = key;
      first = false;
      const bytes = Buffer.from(await source.buildBytes(text));
      webview.postMessage({ type: "open", name: source.name, data: bytes.toString("base64") });
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => refresh().catch(() => {}), UPDATE_DELAY_MS);
    };

    const subscription = source.subscribe(schedule);
    const listener = webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case "ready":
          await refresh().catch((err) => vscode.window.showErrorMessage(`Could not read ${source.name}: ${err.message}`));
          break;
        case "error":
          vscode.window.showErrorMessage(`DocLang Viewer: ${msg.message}`);
          break;
        case "pref":
          await this.context.globalState.update(PREFS_KEY, { ...this.prefs(), [msg.key]: msg.value });
          break;
        case "validate":
          try {
            webview.postMessage({ type: "validated", id: msg.id, result: await this.validate(msg.markup) });
          } catch (err) {
            webview.postMessage({ type: "validated", id: msg.id, error: String(err?.message ?? err) });
          }
          break;
      }
    });
    panel.onDidDispose(() => {
      clearTimeout(timer);
      subscription.dispose();
      listener.dispose();
      this.diagnostics.delete(source.textUri);
    });
  }

  /** XSD validation with the viewer's own validator (libxml2 compiled to WASM), loaded on first use. */
  async validate(markup) {
    this.validator ??= import(pathToFileURL(vscode.Uri.joinPath(this.mediaRoot, "validator-core.mjs").fsPath).href);
    const { validate } = await this.validator;
    const schema = vscode.Uri.joinPath(this.mediaRoot, "schema", "doclang.xsd");
    return validate(markup, () => vscode.workspace.fs.readFile(schema));
  }

  /** Validate `text` and publish the issues as diagnostics (squiggles) on `uri`. */
  async check(text, uri) {
    let result;
    try {
      result = await this.validate(text);
    } catch {
      return { issues: [] };
    }
    const lines = text.split("\n");
    this.diagnostics.set(
      uri,
      result.issues.map((issue) => {
        const line = Math.min(Math.max((issue.line ?? 1) - 1, 0), lines.length - 1);
        const start = Math.max((issue.col ?? 1) - 1, 0);
        const range = new vscode.Range(line, start, line, Math.max(lines[line].length, start + 1));
        const diagnostic = new vscode.Diagnostic(range, issue.message, vscode.DiagnosticSeverity.Error);
        diagnostic.source = issue.kind === "schema" ? "DocLang schema" : "DocLang";
        return diagnostic;
      }),
    );
    return result;
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
    const bootstrap = `<script nonce="${nonce}">${hostBootstrap(json(this.prefs()))}</script>`;
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
function hostBootstrap(prefsJson) {
  return `
const vscode = acquireVsCodeApi();
const prefs = ${prefsJson};
const pendingRequests = new Map();
let requestSeq = 0;
window.DOCLANG_VIEWER_HOST = {
  demo: false,
  embedded: true,
  readOnly: true,
  storage: {
    getItem: (key) => prefs[key] ?? null,
    setItem: (key, value) => {
      prefs[key] = value;
      vscode.postMessage({ type: 'pref', key, value });
    },
  },
  // Validation runs in the extension host: webviews cannot start module workers from their resource origin.
  validate: (markup) => new Promise((resolve, reject) => {
    const id = ++requestSeq;
    pendingRequests.set(id, { resolve, reject });
    vscode.postMessage({ type: 'validate', id, markup });
  }),
};
// Bytes travel as base64: structured typed-array support in webview messaging varies by VS Code version.
const reportError = (err) => vscode.postMessage({ type: 'error', message: String(err?.stack ?? err?.message ?? err) });
window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));
window.addEventListener('message', ({ data }) => {
  if (data.type === 'open') {
    const bytes = Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0));
    window.DocLangViewer.open(data.name, bytes.buffer).catch(reportError);
  } else if (data.type === 'validated') {
    const pending = pendingRequests.get(data.id);
    pendingRequests.delete(data.id);
    if (data.error) pending?.reject(new Error(data.error)); else pending?.resolve(data.result);
  }
});
window.__doclangHostReady = () => vscode.postMessage({ type: 'ready' });
`;
}

module.exports = { ViewerShell };
