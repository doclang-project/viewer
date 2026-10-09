// XSD validation of DocLang markup, shared by the web worker (validator-worker.mjs) and Node hosts.
// Mirrors doclang/xsd_validation.py (lxml → libxml2) so results match
// `doclang validate --xsd-only --allow-empty-namespace` (i.e. `-n`).

// libxml2-wasm instantiates its WASM with top-level await; importing it dynamically lets a worker's
// message listener register synchronously, so messages sent during startup aren't dropped.
const libxml2 = import("./vendor/libxml2-wasm/index.mjs");

const DOCLANG_NS = "https://www.doclang.ai/ns/v0";
const DTD_REJECTED_MESSAGE = "DTD declarations and entity references are not allowed in DocLang documents";

/** @type {Promise<{ validator: import("./vendor/libxml2-wasm/index.mjs").XsdValidator, schemaVersion: string | null }> | null} */
let schemaPromise = null;

/** @param {() => Promise<Uint8Array>} readSchema reads schema/doclang.xsd */
function loadSchema(readSchema) {
  schemaPromise ??= (async () => {
    const { XmlDocument, XsdValidator } = await libxml2;
    const xsdDoc = XmlDocument.fromBuffer(await readSchema(), { url: "doclang.xsd" });
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

/** @returns {Promise<{ schemaVersion: string | null, issues: object[] }>} */
export async function validate(markup, readSchema) {
  const { XmlDocument, XmlValidateError, XmlParseError } = await libxml2;
  const { validator, schemaVersion } = await loadSchema(readSchema);
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
