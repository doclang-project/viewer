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
 */

import { LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { buildDocumentState } from '../../doclang/document';
import { elementThreadId } from '../../doclang/dom';
import type { DocumentState } from '../../doclang/types';

export abstract class DoclangPageElement extends LitElement {
  @property({ type: Number, reflect: true }) declare page: number;
  @property({ type: String, reflect: true }) declare selected: string | null;

  protected _docState: DocumentState | null = null;
  protected _peerIds: Set<string> = new Set();

  // ---------------------------------------------------------------------------
  // Public document property
  // ---------------------------------------------------------------------------

  get document(): DocumentState | null {
    return this._docState;
  }

  set document(state: DocumentState | null) {
    const old = this._docState;
    this._docState = state;
    // Manually notify Lit so updated() sees '_docState' in `changed`, even
    // though _docState is not a @property/@state field.  This is the correct
    // Lit pattern for a plain field that needs to participate in the update
    // lifecycle without being exposed as a public reflected attribute.
    this.requestUpdate('_docState', old);
    if (!state) {
      this.page = 1;
      this._clearDocument();
    }
  }

  // ---------------------------------------------------------------------------
  // Lit lifecycle
  // ---------------------------------------------------------------------------

  override connectedCallback(): void {
    super.connectedCallback();
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

  override attributeChangedCallback(name: string, _old: string, next: string): void {
    super.attributeChangedCallback(name, _old, next);
    if (name === 'src' && next) {
      this._loadFromUrl(next);
    }
  }

  override updated(changed: PropertyValues): void {
    super.updated(changed);

    if ((changed.has('page') || changed.has('_docState')) && this._docState) {
      // Clamp page to valid range whenever page or the document changes.
      const clamped = Math.min(Math.max(1, this.page), this._docState.pageCount);
      if (clamped !== this.page) {
        this.page = clamped;
        return; // updated() will fire again with the clamped value
      }
      this._renderDocument();
    }

    if (changed.has('selected')) {
      this._peerIds = this.selected ? this._computePeerIds(this.selected) : new Set();
      this._applySelection();
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
