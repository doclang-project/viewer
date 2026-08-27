/** File-collection controller — owns catalog state and all mutation logic */

import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { FileCatalogEntry } from '../../doclang/types';
import type { DocumentState } from '../../doclang/types';
import {
  PAGE_IMAGE_RE,
  buildDocumentState,
  extractArchiveFromFiles,
  extractArchiveFromZipBuffer,
  revokeDocumentState,
} from '../../doclang/document';
import { PAGE_ZOOM_DEFAULT } from '../page-view-pane/overlay';
import { unzip } from '../../doclang/zip';

export interface CollectionEntry {
  label: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

export class CollectionController implements ReactiveController {
  private readonly _host: ReactiveControllerHost;

  // Catalog state — mutations call _requestUpdate() so the host re-renders.
  private _catalog: FileCatalogEntry[] = [];
  private _activeIndex = -1;

  constructor(host: ReactiveControllerHost) {
    this._host = host;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {}

  get entries(): CollectionEntry[] {
    return this._catalog.map((entry, i) => ({
      label: entry.label,
      thumbnailUrl: entry.thumbnailUrl,
      isActive: i === this._activeIndex,
    }));
  }

  get size(): number {
    return this._catalog.length;
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  get activeEntry(): FileCatalogEntry | null {
    return this._catalog[this._activeIndex] ?? null;
  }

  hasMultiple(): boolean {
    return this._catalog.length > 1;
  }

  async addFiles(files: File[], { replace = false } = {}): Promise<DocumentState | null> {
    if (replace) this._clearAll();
    const startIndex = this._catalog.length;
    for (const file of files) {
      const entry = this._createEntry(file);
      this._catalog.push(entry);
      this._enrichThumbnail(entry);
    }
    if (!this._catalog.length) return null;
    return this._switchTo(replace ? 0 : startIndex);
  }

  async addArchiveBuffer(
    buffer: ArrayBuffer,
    label: string,
    { replace = false } = {}
  ): Promise<DocumentState | null> {
    if (replace) this._clearAll();
    const entry: FileCatalogEntry = {
      id: crypto.randomUUID(),
      label,
      kind: 'archive',
      source: buffer,
      currentPage: 1,
      pageZoom: PAGE_ZOOM_DEFAULT,
      snapshot: null,
      thumbnailUrl: null,
    };
    this._catalog.push(entry);
    this._enrichThumbnail(entry);
    return this._switchTo(replace ? 0 : this._catalog.length - 1);
  }

  async appendFolderArchive(files: File[]): Promise<DocumentState | null> {
    if (!files.some(f => f.name === 'document.xml')) {
      alert('Archive must contain document.xml at its root.');
      return null;
    }
    const rootName =
      (files[0]!.webkitRelativePath || files[0]!.name).split('/')[0] || 'archive';
    const entry: FileCatalogEntry = {
      id: crypto.randomUUID(),
      label: rootName,
      kind: 'folder',
      source: files,
      currentPage: 1,
      pageZoom: PAGE_ZOOM_DEFAULT,
      snapshot: null,
      thumbnailUrl: null,
    };
    this._catalog.push(entry);
    this._enrichThumbnail(entry);
    return this._switchTo(this._catalog.length - 1);
  }

  /** Persist scroll/zoom state for the currently-active entry. */
  persistActiveViewState(page: number, zoomPercent: number): void {
    const entry = this.activeEntry;
    if (!entry) return;
    entry.currentPage = page;
    entry.pageZoom = zoomPercent;
  }

  /** Switch to the entry at index; returns the parsed DocumentState or null on failure. */
  async selectEntry(index: number): Promise<DocumentState | null> {
    if (index < 0 || index >= this._catalog.length) return null;
    this._releaseActive();
    return this._switchTo(index);
  }

  /** Close (remove) the entry at index; returns the new active DocumentState, or null. */
  async closeEntry(index: number): Promise<{ doc: DocumentState | null; newIndex: number }> {
    if (index < 0 || index >= this._catalog.length) return { doc: null, newIndex: -1 };
    const wasActive = index === this._activeIndex;
    const entry = this._catalog[index]!;
    if (wasActive) {
      this._releaseActive();
      this._activeIndex = -1;
    }
    this._revoke(entry);
    this._catalog.splice(index, 1);

    if (!this._catalog.length) {
      this._requestUpdate();
      return { doc: null, newIndex: -1 };
    }
    if (wasActive) {
      const nextIndex = Math.min(index, this._catalog.length - 1);
      const doc = await this._switchTo(nextIndex);
      return { doc, newIndex: this._activeIndex };
    }
    if (index < this._activeIndex) this._activeIndex -= 1;
    this._requestUpdate();
    return { doc: null, newIndex: this._activeIndex };
  }

  clearAll(): void {
    this._clearAll();
    this._requestUpdate();
  }

  isArchiveFile(file: File): boolean {
    return /\.dclx$/i.test(file.name) || /\.zip$/i.test(file.name);
  }

  isMarkupFile(file: File): boolean {
    return /\.(?:dclg(?:\.xml)?|xml)$/i.test(file.name);
  }

  private _requestUpdate(): void {
    this._host.requestUpdate();
  }

  private async _switchTo(index: number): Promise<DocumentState | null> {
    this._activeIndex = index;
    const entry = this._catalog[index]!;
    const doc = await this._parse(entry);
    if (!doc) {
      this._revoke(entry);
      this._catalog.splice(index, 1);
      this._activeIndex = -1;
      this._requestUpdate();
      if (this._catalog.length)
        return this._switchTo(Math.min(index, this._catalog.length - 1));
      return null;
    }
    entry.snapshot = doc;
    return doc;
  }

  private _releaseActive(): void {
    const entry = this.activeEntry;
    if (entry?.snapshot) {
      revokeDocumentState(entry.snapshot);
      entry.snapshot = null;
    }
  }

  private _clearAll(): void {
    this._releaseActive();
    for (const entry of this._catalog) this._revoke(entry);
    this._catalog = [];
    this._activeIndex = -1;
  }

  private _revoke(entry: FileCatalogEntry): void {
    if (entry.thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(entry.thumbnailUrl);
    entry.thumbnailUrl = null;
  }

  private _createEntry(file: File): FileCatalogEntry {
    return {
      id: crypto.randomUUID(),
      label: file.name,
      kind: this.isMarkupFile(file) ? 'markup' : 'archive',
      source: file,
      currentPage: 1,
      pageZoom: PAGE_ZOOM_DEFAULT,
      snapshot: null,
      thumbnailUrl: null,
    };
  }

  private _enrichThumbnail(entry: FileCatalogEntry): void {
    this._resolveThumbnail(entry).then(url => {
      if (!this._catalog.includes(entry)) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
        return;
      }
      if (url) this._requestUpdate();
    });
  }

  private async _resolveThumbnail(entry: FileCatalogEntry): Promise<string | null> {
    if (entry.thumbnailUrl) return entry.thumbnailUrl;
    if (entry.kind === 'markup') return null;
    try {
      if (entry.kind === 'folder')
        entry.thumbnailUrl = this._firstPageUrlFromFiles(entry.source as File[]);
      else if (entry.kind === 'archive')
        entry.thumbnailUrl = await this._firstPageUrlFromZip(entry.source as File | ArrayBuffer);
    } catch {
      entry.thumbnailUrl = null;
    }
    return entry.thumbnailUrl;
  }

  private _firstPageUrlFromFiles(files: File[]): string | null {
    let bestPage = Infinity;
    let bestFile: File | null = null;
    for (const f of files) {
      const relPath = f.webkitRelativePath || f.name;
      const parts = relPath.split('/');
      if (parts.length < 2 || parts[parts.length - 2] !== 'pages') continue;
      const m = PAGE_IMAGE_RE.exec(f.name);
      if (!m) continue;
      const pageNum = Number(m[1]);
      if (pageNum < bestPage) { bestPage = pageNum; bestFile = f; }
    }
    return bestFile ? URL.createObjectURL(bestFile) : null;
  }

  private async _firstPageUrlFromZip(source: File | ArrayBuffer): Promise<string | null> {
    const buffer = source instanceof File ? await source.arrayBuffer() : source;
    const entries = await unzip(buffer, {
      shouldExtract: name => /^pages\/\d+\.(png|jpe?g|webp)$/i.test(name),
    });
    let bestPage = Infinity;
    let bestEntry: { name: string; data: Uint8Array } | null = null;
    for (const e of entries) {
      const m = e.name.match(/^pages\/(\d+)\.(png|jpe?g|webp)$/i);
      if (!m) continue;
      const pageNum = Number(m[1]);
      if (pageNum < bestPage) { bestPage = pageNum; bestEntry = e; }
    }
    if (!bestEntry) return null;
    const ext = bestEntry.name.split('.').pop() ?? 'png';
    return URL.createObjectURL(new Blob([bestEntry.data as BlobPart], { type: this._mimeFromExt(ext) }));
  }

  private _mimeFromExt(ext: string): string {
    const n = ext.toLowerCase().replace('jpeg', 'jpg');
    if (n === 'png') return 'image/png';
    if (n === 'webp') return 'image/webp';
    return 'image/jpeg';
  }

  private async _parse(entry: FileCatalogEntry): Promise<DocumentState | null> {
    try {
      if (entry.kind === 'markup') {
        const text =
          entry.source instanceof File
            ? await (entry.source as File).text()
            : new TextDecoder().decode(entry.source as ArrayBuffer);
        return buildDocumentState(text, new Map(), entry.label, new Map(), { markupOnly: true });
      }
      if (entry.kind === 'archive') {
        const buffer =
          entry.source instanceof File
            ? await (entry.source as File).arrayBuffer()
            : (entry.source as ArrayBuffer);
        const { markupXml, pageImages, assetUrls } = await extractArchiveFromZipBuffer(buffer);
        return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
      }
      if (entry.kind === 'folder') {
        const { markupXml, pageImages, assetUrls } = await extractArchiveFromFiles(entry.source as File[]);
        return buildDocumentState(markupXml, pageImages, entry.label, assetUrls, { markupOnly: false });
      }
    } catch (err) {
      alert(`Failed to read ${entry.label}: ${(err as Error).message}`);
    }
    return null;
  }
}
