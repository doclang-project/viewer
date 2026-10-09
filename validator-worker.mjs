// XSD validation of DocLang markup, run off the main thread (see validator-core.mjs).
import { validate } from "./validator-core.mjs";

const SCHEMA_URL = new URL("./schema/doclang.xsd", import.meta.url);

async function readSchema() {
  const res = await fetch(SCHEMA_URL);
  if (!res.ok) throw new Error(`Failed to load schema (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

self.addEventListener("message", async (e) => {
  const { id, markup } = e.data;
  try {
    self.postMessage({ id, ok: true, ...(await validate(markup, readSchema)) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err?.message ?? err) });
  }
});
