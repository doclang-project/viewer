// Minimal DocLang archive (.dclx, a ZIP) access: read document.xml and swap it, carrying every other entry over as is.
const crypto = require("node:crypto");
const zlib = require("node:zlib");

const DOCUMENT = "document.xml";
const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Entries in file order, each with its central record and the local record (header + data) as stored.
 * @param {Buffer} zip
 */
function parse(zip) {
  let eocd = -1;
  for (let i = zip.length - 22; i >= 0; i -= 1) {
    if (zip.readUInt32LE(i) === SIG_EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive");
  const count = zip.readUInt16LE(eocd + 10);
  const centralOffset = zip.readUInt32LE(eocd + 16);
  if (count === 0xffff || centralOffset === 0xffffffff) throw new Error("ZIP64 archives are not supported");

  const entries = [];
  let offset = centralOffset;
  for (let i = 0; i < count; i += 1) {
    if (zip.readUInt32LE(offset) !== SIG_CENTRAL) throw new Error("Invalid ZIP central directory");
    const nameLength = zip.readUInt16LE(offset + 28);
    const length = 46 + nameLength + zip.readUInt16LE(offset + 30) + zip.readUInt16LE(offset + 32);
    entries.push({
      name: zip.toString("utf8", offset + 46, offset + 46 + nameLength),
      method: zip.readUInt16LE(offset + 10),
      compressedSize: zip.readUInt32LE(offset + 20),
      localOffset: zip.readUInt32LE(offset + 42),
      central: zip.subarray(offset, offset + length),
    });
    offset += length;
  }
  // A local record runs up to the next one (this includes any data descriptor).
  const byOffset = [...entries].sort((a, b) => a.localOffset - b.localOffset);
  byOffset.forEach((entry, i) => {
    const end = byOffset[i + 1]?.localOffset ?? centralOffset;
    entry.local = zip.subarray(entry.localOffset, end);
  });
  return { entries: byOffset };
}

/** @param {Buffer} zip @returns {Buffer} the bytes of document.xml */
function readDocument(zip) {
  const entry = parse(zip).entries.find((e) => e.name === DOCUMENT);
  if (!entry) throw new Error(`Archive must contain ${DOCUMENT}`);
  const { local } = entry;
  if (local.readUInt32LE(0) !== SIG_LOCAL) throw new Error("Invalid ZIP local header");
  const start = 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
  const data = local.subarray(start, start + entry.compressedSize);
  if (entry.method === 0) return Buffer.from(data);
  if (entry.method === 8) return zlib.inflateRawSync(data);
  throw new Error(`Unsupported ZIP compression method ${entry.method}`);
}

/** @param {Buffer} zip @param {Uint8Array} xml @returns {Buffer} the archive with document.xml replaced */
function replaceDocument(zip, xml) {
  const { entries } = parse(zip);
  if (!entries.some((e) => e.name === DOCUMENT)) throw new Error(`Archive must contain ${DOCUMENT}`);

  const data = Buffer.from(xml);
  const deflated = zlib.deflateRawSync(data);
  const useDeflate = deflated.length < data.length;
  const body = useDeflate ? deflated : data;
  const nameBytes = Buffer.from(DOCUMENT);
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const crc = crc32(data);
  const method = useDeflate ? 8 : 0;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(SIG_LOCAL, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(dosTime, 10);
  local.writeUInt16LE(dosDate, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(body.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  const localRecord = Buffer.concat([local, nameBytes, body]);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(SIG_CENTRAL, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(dosTime, 12);
  central.writeUInt16LE(dosDate, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(body.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBytes.length, 28);
  const centralRecord = Buffer.concat([central, nameBytes]);

  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const entry of entries) {
    const isDocument = entry.name === DOCUMENT;
    const record = isDocument ? localRecord : entry.local;
    const header = Buffer.from(isDocument ? centralRecord : entry.central);
    header.writeUInt32LE(offset, 42);
    locals.push(record);
    centrals.push(header);
    offset += record.length;
  }
  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, eocd]);
}

/** A digest of everything in the archive except document.xml (names, checksums, sizes). */
function assetsFingerprint(zip) {
  const hash = crypto.createHash("sha1");
  for (const entry of parse(zip).entries) {
    if (entry.name === DOCUMENT) continue;
    hash.update(entry.name).update(entry.central.subarray(16, 28));
  }
  return hash.digest("hex");
}

module.exports = { readDocument, replaceDocument, assetsFingerprint };
