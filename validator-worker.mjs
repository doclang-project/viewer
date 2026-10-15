// XSD validation of DocLang markup, run off the main thread.
// A document is validated against the schema of the version it declares (`<doclang version="0.8">`);
// without one, against the default (latest) version. Schemas live in schema/, listed in schema/versions.json.
// Mirrors doclang/xsd_validation.py (lxml → libxml2) so results match
// `doclang validate --xsd-only --allow-empty-namespace` (i.e. `-n`).

// libxml2-wasm instantiates its WASM with top-level await; importing it dynamically lets the
// message listener below register synchronously, so messages sent during startup aren't dropped.
const libxml2 = import("./vendor/libxml2-wasm/index.mjs");

const DOCLANG_NS = "https://www.doclang.ai/ns/v0";
const SCHEMA_DIR = new URL("./schema/", import.meta.url);
const DTD_REJECTED_MESSAGE = "DTD declarations and entity references are not allowed in DocLang documents";

async function fetchSchemaFile(name) {
  const res = await fetch(new URL(name, SCHEMA_DIR));
  if (!res.ok) throw new Error(`Failed to load ${name} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** @type {Promise<{ default: string, versions: Record<string, { file: string, tag: string }> }> | null} */
let versionsPromise = null;

function loadVersions() {
  versionsPromise ??= fetchSchemaFile("versions.json")
    .then((bytes) => JSON.parse(new TextDecoder().decode(bytes)))
    .catch((err) => {
      versionsPromise = null;
      throw err;
    });
  return versionsPromise;
}

/** Compiled schemas by minor version. */
const schemaPromises = new Map();

function loadSchema(minor, file) {
  if (!schemaPromises.has(minor)) {
    schemaPromises.set(
      minor,
      (async () => {
        const { XmlDocument, XsdValidator } = await libxml2;
        const xsdDoc = XmlDocument.fromBuffer(await fetchSchemaFile(file), { url: file });
        const schemaVersion = xsdDoc.root.attr("version")?.value ?? null;
        // xsdDoc stays alive for the worker's lifetime: the compiled schema may reference its nodes.
        const validator = XsdValidator.fromDoc(xsdDoc);
        return { validator, schemaVersion };
      })().catch((err) => {
        schemaPromises.delete(minor);
        throw err;
      }),
    );
  }
  return schemaPromises.get(minor);
}

/**
 * The schema to validate a document declaring `declared` against: its `major.minor`, or the default
 * when it declares none or something that is not a version at all (the schema reports that itself).
 * @returns {{ minor: string, file: string } | { unsupported: string, supported: string[] }}
 */
function pickSchema(versions, declared) {
  const minor = declared == null ? versions.default : declared.trim().match(/^(\d+)\.(\d+)/)?.slice(1, 3).join(".") ?? versions.default;
  const entry = versions.versions[minor];
  return entry ? { minor, file: entry.file } : { unsupported: minor, supported: Object.keys(versions.versions) };
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
  const versions = await loadVersions();
  let doc;
  try {
    doc = XmlDocument.fromString(markup, { url: "document.xml" });
  } catch (err) {
    if (err instanceof XmlParseError) {
      return { schemaVersion: null, issues: err.details.map((d) => toIssue(d, "parse")) };
    }
    throw err;
  }
  try {
    if (doc.dtd) {
      return { schemaVersion: null, issues: [{ kind: "policy", message: DTD_REJECTED_MESSAGE, line: null, col: null, xpath: null }] };
    }
    const picked = pickSchema(versions, doc.root.attr("version")?.value);
    if (picked.unsupported) {
      const message = `Unsupported DocLang version "${picked.unsupported}" (supported: ${picked.supported.join(", ")})`;
      return { schemaVersion: null, issues: [{ kind: "version", message, line: null, col: null, xpath: null }] };
    }
    const { validator, schemaVersion } = await loadSchema(picked.minor, picked.file);
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
