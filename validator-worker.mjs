// XSD validation of DocLang markup, run off the main thread.
// Mirrors doclang/xsd_validation.py (lxml → libxml2) so results match
// `doclang validate --xsd-only --allow-empty-namespace` (i.e. `-n`).

// libxml2-wasm instantiates its WASM with top-level await; importing it dynamically lets the
// message listener below register synchronously, so messages sent during startup aren't dropped.
const libxml2 = import("./vendor/libxml2-wasm/index.mjs");

const DOCLANG_NS = "https://www.doclang.ai/ns/v0";
const SCHEMA_URL = new URL("./schema/doclang.xsd", import.meta.url);
const DTD_REJECTED_MESSAGE = "DTD declarations and entity references are not allowed in DocLang documents";

/** @type {Promise<{ validator: import("./vendor/libxml2-wasm/index.mjs").XsdValidator, schemaVersion: string | null }> | null} */
let schemaPromise = null;

function loadSchema() {
  schemaPromise ??= (async () => {
    const { XmlDocument, XsdValidator } = await libxml2;
    const res = await fetch(SCHEMA_URL);
    if (!res.ok) throw new Error(`Failed to load schema (${res.status})`);
    const xsdDoc = XmlDocument.fromBuffer(new Uint8Array(await res.arrayBuffer()), { url: "doclang.xsd" });
    const schemaVersion = xsdDoc.root.attr("version")?.value ?? null;
    // xsdDoc stays alive for the worker's lifetime: the compiled schema may reference its nodes.
    const validator = XsdValidator.fromDoc(xsdDoc);
    return { validator, schemaVersion };
  })().catch((err) => {
    schemaPromise = null;
    throw err;
  });
  return schemaPromise;
}

/**
 * Like doclang.utils._ensure_namespace: a document whose root has no namespace gets the DocLang
 * namespace on every un-namespaced element. Done in place so line numbers stay intact.
 */
function ensureNamespace(doc) {
  const root = doc.root;
  if (root.namespaceUri) return;
  root.addNsDeclaration(DOCLANG_NS);
  for (const el of root.find("descendant-or-self::*")) {
    if (!el.namespaceUri) el.prefix = null; // null → the in-scope default namespace
  }
}

function toIssue(detail, kind) {
  return {
    kind,
    message: detail.message.trim(),
    line: detail.line || null,
    col: detail.col || null,
    xpath: detail.xpath ?? null,
  };
}

async function validate(markup) {
  const { XmlDocument, XmlValidateError, XmlParseError } = await libxml2;
  const { validator, schemaVersion } = await loadSchema();
  let doc;
  try {
    doc = XmlDocument.fromString(markup, { url: "document.xml" });
  } catch (err) {
    if (err instanceof XmlParseError) {
      return { schemaVersion, issues: err.details.map((d) => toIssue(d, "parse")) };
    }
    throw err;
  }
  try {
    if (doc.dtd) {
      return { schemaVersion, issues: [{ kind: "policy", message: DTD_REJECTED_MESSAGE, line: null, col: null, xpath: null }] };
    }
    ensureNamespace(doc);
    try {
      validator.validate(doc);
      return { schemaVersion, issues: [] };
    } catch (err) {
      if (err instanceof XmlValidateError) {
        return { schemaVersion, issues: err.details.map((d) => toIssue(d, "schema")) };
      }
      throw err;
    }
  } finally {
    doc.dispose();
  }
}

self.addEventListener("message", async (e) => {
  const { id, markup } = e.data;
  try {
    self.postMessage({ id, ok: true, ...(await validate(markup)) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) });
  }
});
