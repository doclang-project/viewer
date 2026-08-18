import {
  ZIP_MAX_ENTRIES,
  ZIP_MAX_ENTRY_COMPRESSED_BYTES,
  ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES,
  ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES,
  ZIP_MAX_COMPRESSION_RATIO,
} from '../constants';
export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export async function unzip(
  buffer: ArrayBuffer,
  { shouldExtract }: { shouldExtract?: (name: string) => boolean } = {}
): Promise<ZipEntry[]> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      'ZIP decompression requires a browser with DecompressionStream support'
    );
  }

  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const eocdOffset = findEndOfCentralDirectory(bytes);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  if (entryCount > ZIP_MAX_ENTRIES) {
    throw new Error('ZIP archive has too many entries');
  }
  if (centralDirOffset >= bytes.length) {
    throw new Error('Invalid ZIP central directory offset');
  }

  const entries: ZipEntry[] = [];
  let offset = centralDirOffset;
  let totalUncompressed = 0;

  for (let i = 0; i < entryCount; i += 1) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Invalid ZIP central directory');
    }

    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nameEnd = offset + 46 + nameLength;
    if (nameEnd > bytes.length) {
      throw new Error('Invalid ZIP entry name');
    }
    const rawName = new TextDecoder().decode(bytes.subarray(offset + 46, nameEnd));
    const name = normalizeZipEntryName(rawName);

    offset = nameEnd + extraLength + commentLength;
    if (offset > bytes.length) {
      throw new Error('Invalid ZIP central directory');
    }

    if (!name || name.endsWith('/') || isIgnoredArchiveEntry(name)) continue;
    if (shouldExtract && !shouldExtract(name)) continue;

    if (
      compressedSize > ZIP_MAX_ENTRY_COMPRESSED_BYTES ||
      uncompressedSize > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES
    ) {
      throw new Error(`ZIP entry exceeds size limit: ${name}`);
    }
    if (
      compressedSize > 0 &&
      uncompressedSize > 0 &&
      uncompressedSize / compressedSize > ZIP_MAX_COMPRESSION_RATIO
    ) {
      throw new Error(`ZIP entry compression ratio exceeds limit: ${name}`);
    }
    if (totalUncompressed + uncompressedSize > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP archive exceeds total uncompressed size limit');
    }

    if (
      localHeaderOffset + 30 > bytes.length ||
      view.getUint32(localHeaderOffset, true) !== 0x04034b50
    ) {
      throw new Error(`Invalid ZIP local header: ${name}`);
    }
    const localNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > bytes.length) {
      throw new Error(`ZIP entry data out of bounds: ${name}`);
    }
    const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
    const data = await decompressZipEntry(compressed, compression, uncompressedSize);
    totalUncompressed += data.length;
    if (totalUncompressed > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP archive exceeds total uncompressed size limit');
    }
    entries.push({ name, data });
  }

  return entries;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (
      bytes[i] === 0x50 &&
      bytes[i + 1] === 0x4b &&
      bytes[i + 2] === 0x05 &&
      bytes[i + 3] === 0x06
    ) {
      return i;
    }
  }
  throw new Error('Invalid ZIP archive');
}

function concatUint8Arrays(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function decompressZipEntry(
  data: Uint8Array,
  method: number,
  uncompressedSize: number
): Promise<Uint8Array> {
  if (method === 0) {
    if (data.length > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP entry exceeds size limit');
    }
    return data;
  }
  if (method === 8) {
    const stream = new Blob([data as BlobPart])
      .stream()
      .pipeThrough(new DecompressionStream('deflate-raw'));
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > ZIP_MAX_ENTRY_UNCOMPRESSED_BYTES) {
          throw new Error('ZIP entry exceeds size limit');
        }
        if (data.length > 0 && total / data.length > ZIP_MAX_COMPRESSION_RATIO) {
          throw new Error('ZIP entry compression ratio exceeds limit');
        }
        chunks.push(value);
      }
    } catch (err) {
      try {
        await reader.cancel();
      } catch {
        /* ignore cancel errors */
      }
      throw err;
    }

    const out = concatUint8Arrays(chunks, total);
    if (uncompressedSize && out.length !== uncompressedSize) {
      return out.slice(0, Math.min(out.length, uncompressedSize));
    }
    return out;
  }
  throw new Error(`Unsupported ZIP compression method ${method}`);
}

function normalizeZipEntryName(name: string): string {
  return name.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function findArchiveEntry(
  entries: ZipEntry[],
  fileName: string
): ZipEntry | undefined {
  return entries.find(e => e.name === fileName);
}

export function isIgnoredArchiveEntry(name: string): boolean {
  if (name === '.DS_Store' || name.endsWith('/.DS_Store')) return true;
  return name.split('/').some(part => part.startsWith('._') || part === '__MACOSX');
}

export async function extractArchiveFromZipBuffer(buffer: ArrayBuffer): Promise<{
  markupXml: string;
  pageImages: Map<number, string>;
  assetUrls: Map<string, string>;
}> {
  const entries = await unzip(buffer);
  const markupEntry = findArchiveEntry(entries, 'document.xml');
  if (!markupEntry) {
    throw new Error('Archive must contain document.xml');
  }
  const markupXml = new TextDecoder().decode(markupEntry.data);
  const pageImages = new Map<number, string>();
  const assetUrls = new Map<string, string>();
  for (const e of entries) {
    const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
    if (m) {
      const ext = m[2]!.toLowerCase().replace('jpeg', 'jpg');
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      pageImages.set(
        Number(m[1]),
        URL.createObjectURL(new Blob([e.data as BlobPart], { type: mime }))
      );
      continue;
    }
    if (e.name.startsWith('assets/') && !e.name.endsWith('/')) {
      assetUrls.set(
        e.name,
        URL.createObjectURL(
          new Blob([e.data as BlobPart], { type: mimeFromAssetPath(e.name) })
        )
      );
    }
  }
  return { markupXml, pageImages, assetUrls };
}

function mimeFromAssetPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}
