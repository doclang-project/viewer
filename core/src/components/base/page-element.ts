/**
 * Base class for doclang web components that render document content.
 *
 * Supports three ways to provide the DocLang document:
 *
 *   1. `src` attribute — a URL (http:, data:, blob:) pointing to either a
 *      raw XML markup string or a .dclx/.zip archive.  The component fetches
 *      and parses it automatically.
 *
 *   2. Inline child `<script type="application/doclang+xml">` — the XML is
 *      taken from the element's text content during `connectedCallback`.
 *
 *   3. `component.document = state` — set an already-parsed `DocumentState`
 *      directly via the JS property (fastest path, used by the viewer app).
 *
 * Once a document is available, `_renderDocument()` is called.  Subclasses
 * must implement that method.  They may also override `_clearDocument()` to
 * reset their view when the document is removed.
 *
 * The `page` attribute / property controls which page is rendered.  Setting
 * `page="3"` in HTML or `component.page = 3` in JS both trigger a re-render.
 */

import { DoclangHTMLElement } from './element';
import { buildDocumentState } from '../../doclang/document';
import { elementThreadId } from '../../doclang/dom';
import type { DocumentState } from '../../doclang/types';

export abstract class DoclangPageElement extends DoclangHTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'page', 'selected'];
  }

  protected _docState: DocumentState | null = null;
  protected _currentPage = 1;
  protected _selectedId: string | null = null;
  protected _peerIds: Set<string> = new Set();

  // ---------------------------------------------------------------------------
  // Public document property
  // ---------------------------------------------------------------------------

  get document(): DocumentState | null {
    return this._docState;
  }

  set document(state: DocumentState | null) {
    this._docState = state;
    this._currentPage = state ? state.currentPage : 1;
    if (state) {
      this._renderDocument();
    } else {
      this._clearDocument();
    }
  }

  // ---------------------------------------------------------------------------
  // Public selected property (also reflected as the `selected` attribute)
  // ---------------------------------------------------------------------------

  get selected(): string | null {
    return this._selectedId;
  }

  set selected(id: string | null) {
    this._selectedId = id;
    this._peerIds = id ? this._computePeerIds(id) : new Set();
    // Reflect to attribute.
    if (id) {
      this.setAttribute('selected', id);
    } else {
      this.removeAttribute('selected');
    }
    this._applySelection();
  }

  // ---------------------------------------------------------------------------
  // Public page property (also reflected as the `page` attribute)
  // ---------------------------------------------------------------------------

  get page(): number {
    return this._currentPage;
  }

  set page(n: number) {
    if (!this._docState) return;
    const p = Math.min(Math.max(1, n), this._docState.pageCount);
    if (p === this._currentPage) return;
    this._currentPage = p;
    this._docState.currentPage = p;
    // Reflect to attribute so HTML stays in sync, without re-entering the setter.
    this.setAttribute('page', String(p));
    this._renderDocument();
  }

  // ---------------------------------------------------------------------------
  // Lifecycle — src / page attributes and inline script
  // ---------------------------------------------------------------------------

  connectedCallback(): void {
    // Pick up inline <script type="application/doclang+xml"> if present and
    // no document has been set programmatically and no src attribute exists.
    if (!this._docState && !this.hasAttribute('src')) {
      const script = this.querySelector('script[type="application/doclang+xml"]');
      if (script?.textContent?.trim()) {
        this._loadXmlString(
          script.textContent.trim(),
          this.getAttribute('label') ?? ''
        );
      }
    }
  }

  attributeChangedCallback(name: string, _old: string, next: string): void {
    if (name === 'src' && next) {
      this._loadFromUrl(next);
    }
    if (name === 'page' && next) {
      const n = parseInt(next, 10);
      if (!isNaN(n)) this.page = n;
    }
    if (name === 'selected') {
      // next is '' when the attribute is removed
      this.selected = next || null;
    }
  }

  // ---------------------------------------------------------------------------
  // Abstract interface for subclasses
  // ---------------------------------------------------------------------------

  /** Called whenever the document or current page changes. */
  protected abstract _renderDocument(): void;

  /** Called when the selected element changes. Default: no-op. */
  protected _applySelection(): void {
    /* subclasses may override */
  }

  /** Called when the document is removed (set to null). Default: no-op. */
  protected _clearDocument(): void {
    /* subclasses may override */
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _computePeerIds(elementId: string): Set<string> {
    const peers = new Set<string>();
    if (!this._docState?.elementIds || !this._docState.idToElement) return peers;
    const el = this._docState.idToElement.get(elementId);
    const threadId = el ? elementThreadId(el) : null;
    if (!threadId) return peers;
    for (const [node, id] of this._docState.elementIds) {
      if (elementThreadId(node) === threadId) peers.add(id);
    }
    return peers;
  }

  // ---------------------------------------------------------------------------
  // Private loading helpers
  // ---------------------------------------------------------------------------

  private _loadXmlString(xml: string, label: string): void {
    const state = buildDocumentState(xml, new Map(), label, new Map(), {
      markupOnly: true,
    });
    if (state) this.document = state;
  }

  private async _loadFromUrl(url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const isZip =
        url.includes('.dclx') ||
        url.includes('.zip') ||
        res.headers.get('content-type')?.includes('zip');
      if (isZip) {
        const { extractArchiveFromZipBuffer } = await import('../../doclang/document');
        const buf = await res.arrayBuffer();
        const { markupXml, pageImages, assetUrls } =
          await extractArchiveFromZipBuffer(buf);
        const label = url.split('/').pop() ?? '';
        const state = buildDocumentState(markupXml, pageImages, label, assetUrls, {
          markupOnly: false,
        });
        if (state) this.document = state;
      } else {
        const xml = await res.text();
        const label = url.split('/').pop() ?? '';
        this._loadXmlString(xml, label);
      }
    } catch (err) {
      this.dispatchEvent(
        new CustomEvent('doclang-load-error', {
          bubbles: true,
          composed: true,
          detail: { error: err },
        })
      );
    }
  }
}
