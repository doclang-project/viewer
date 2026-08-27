/** <doclang-markup-pane> — DocLang XML markup view */

import { html, nothing, render, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { DoclangPageElement } from '../base/page-element';
import { PageController } from '../base/page-controller';
import styles from './markup-pane.css?inline';
import {
  assignElementIds,
  invertElementIds,
  segmentHasMarkup,
  NO_MARKUP,
} from '../../doclang/document';
import {
  HEAD_TAGS,
  CELL_SPAN_TAGS,
  OTSL_CONTAINER_TAGS,
  isTextLikeNode,
  isWhitespaceOnlyText,
  markupAttributes,
  localName,
  childElements,
  formatMarkupTextNode,
  serializeMarkupTextNodes,
  skipUntilListItemBoundary,
  skipUntilCellBoundary,
  isCellToken,
  isSemanticElement,
} from '../../doclang/dom';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VIRTUAL_TEXT_TAG_HINT =
  'DocLang virtual <text>; wrapping tags not included in source';

const LONG_EMBEDDED_URI_PREVIEW_LENGTH = 30;

// ---------------------------------------------------------------------------
// Truncatable embedded URI helpers (Pure Utilities)
// ---------------------------------------------------------------------------

function isTruncatableEmbeddedImageUri(value: string): boolean {
  if (!value || value.length <= LONG_EMBEDDED_URI_PREVIEW_LENGTH) return false;
  return /^(data:image\/|blob:)/i.test(value);
}

function formatCompactByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return kb < 10 ? `${kb.toFixed(1)} KB` : `${Math.round(kb)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEmbeddedUriSizeLabel(value: string): string {
  if (/^blob:/i.test(value)) {
    return value.length >= 1024
      ? `${Math.round(value.length / 1024)} KB URL`
      : `${value.length} char URL`;
  }
  const comma = value.indexOf(',');
  if (comma === -1) return 'embedded data';
  const header = value.slice(0, comma);
  const payload = value.slice(comma + 1).replace(/\s/g, '');
  const mime = /^data:([^;,]+)/i.exec(header)?.[1] ?? '';
  const shortMime = mime.startsWith('image/') ? mime.slice(6) : mime || 'data';
  const bytes = Math.floor((payload.replace(/=+$/, '').length * 3) / 4);
  return `${shortMime} · ${formatCompactByteSize(bytes)}`;
}

// ---------------------------------------------------------------------------
// Slice / virtual-text helpers (Pure Utilities)
// ---------------------------------------------------------------------------

function sliceHasMarkupContent(nodes: ArrayLike<ChildNode>): boolean {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) continue;
    if (isTextLikeNode(node) && !isWhitespaceOnlyText(node)) return true;
    if (node.nodeType === Node.ELEMENT_NODE) return true;
  }
  return false;
}

function isVirtualTextSkippableNode(node: ChildNode): boolean {
  if (isWhitespaceOnlyText(node)) return true;
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  const tag = localName(node as Element);
  return tag === 'location' || HEAD_TAGS.has(tag);
}

function shouldWrapVirtualText(contentNodes: ChildNode[]): boolean {
  if (!sliceHasMarkupContent(contentNodes)) return false;
  for (const node of contentNodes) {
    if (isVirtualTextSkippableNode(node)) continue;
    if (isTextLikeNode(node)) return true;
    if (node.nodeType === Node.ELEMENT_NODE && !isSemanticElement(node as Element))
      return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('doclang-markup-pane')
export class DoclangMarkupPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  private _wheel = new PageController(this, () => this.scrollPane);

  // null = no document loaded yet; false = document loaded but no markup; true = has markup
  @state() private _hasMarkup: boolean | null = null;
  @state() private _markupTemplate: TemplateResult | TemplateResult[] | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-markup');
  }

  /* prettier-ignore */
  override render() {
    return html`<div class="pane-header">DocLang</div><div class="pane-body" id="markup-pane" @click=${this._onBodyClick}>${this._hasMarkup === false ? html`<div class="placeholder">${NO_MARKUP}</div>` : this._hasMarkup === true && this._markupTemplate ? html`<div class="markup">${this._markupTemplate}</div>` : nothing}</div>`;
  }

  /** The scrollable content body inside the shadow root. */
  get scrollPane(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.pane-body') ?? null;
  }

  protected override _applySelection(): void {
    if (!this.shadowRoot) return;
    for (const el of this.shadowRoot.querySelectorAll('.markup-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this.selected) return;
    const target =
      this.shadowRoot.querySelector(
        `.markup-el-virtual-text[data-element-id="${this.selected}"]`
      ) ?? this.shadowRoot.querySelector(`[data-element-id="${this.selected}"]`);
    if (target) {
      target.classList.add('selected');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  protected override _renderDocument(): void {
    const state = this._docState;
    if (!state) {
      this._markupTemplate = null;
      this._hasMarkup = null;
      return;
    }

    const segment = state.segments[this.page - 1] ?? [];
    const elementIds = assignElementIds(segment);
    state.elementIds = elementIds;
    state.idToElement = invertElementIds(elementIds);

    if (segmentHasMarkup(segment)) {
      this._markupTemplate = this._buildMarkupView(segment, elementIds);
      this._hasMarkup = true;
    } else {
      this._markupTemplate = null;
      this._hasMarkup = false;
    }
    this.requestUpdate();
  }

  protected override _clearDocument(): void {
    this._markupTemplate = null;
    this._hasMarkup = null;
    this.requestUpdate();
  }

  private _buildMarkupView(
    segment: Element[],
    elementIds: Map<Element, string>
  ): TemplateResult[] {
    const templates: TemplateResult[] = [];
    for (const el of segment) {
      if (el.nodeType === Node.ELEMENT_NODE) {
        templates.push(this._renderMarkupElement(el, 0, elementIds));
      }
    }
    return templates;
  }

  private _onBodyClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    const attrToggle = target.closest('.xml-attr-value-chip');
    if (attrToggle) {
      e.stopPropagation();
      this._toggleTruncatableMarkupAttrValue(attrToggle);
      return;
    }
    const ghostText = target.closest('.markup-el-virtual-text');
    const elementId = ghostText?.hasAttribute('data-element-id')
      ? ghostText.getAttribute('data-element-id')!
      : (target
          .closest('.markup-el[data-element-id]')
          ?.getAttribute('data-element-id') ?? null);
    if (elementId) {
      this.dispatchEvent(
        new CustomEvent('doclang-element-select', {
          bubbles: true,
          composed: true,
          detail: { id: elementId },
        })
      );
    }
  };

  private _onSummaryClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    // Only toggle the details open/close state if clicking the fold toggle arrow area
    if (!target.closest('.markup-fold-toggle') && !target.closest('.markup-gutter')) {
      e.preventDefault();
    }
  };

  // ---------------------------------------------------------------------------
  // Component-private markup Lit template builders
  // ---------------------------------------------------------------------------

  /* prettier-ignore */
  private _createEmbeddedUriContinuationPanel(value: string, depth: number): HTMLElement {
    const container = document.createElement('div');
    render(
      html`<div class="markup-line markup-embedded-uri-panel" style="--markup-depth: ${depth}"><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true"></span><span class="markup-line-body"><div class="markup-embedded-uri-panel-body" @click=${(e: Event) => e.stopPropagation()}>${value}</div></span></span></div>`,
      container
    );
    return container.firstElementChild as HTMLElement;
  }

  /* prettier-ignore */
  private _renderTruncatableMarkupAttrValue(value: string): TemplateResult {
    const sizeLabel = formatEmbeddedUriSizeLabel(value);
    return html`<span class="xml-attr-value xml-attr-value-truncatable" data-full-value=${value}><span class="xml-attr-value-text">${value.slice(0, LONG_EMBEDDED_URI_PREVIEW_LENGTH)}</span><button type="button" class="xml-attr-value-chip" data-collapsed-label=${sizeLabel} aria-expanded="false" aria-label="Show full value (${sizeLabel})"><span class="xml-attr-value-chip-label">${sizeLabel}</span></button></span>`;
  }

  private _toggleTruncatableMarkupAttrValue(toggle: Element): void {
    const wrapper = toggle.closest('.xml-attr-value-truncatable') as HTMLElement | null;
    if (!wrapper) return;

    const markupLine = wrapper.closest('.markup-line') as HTMLElement | null;
    const fullValue =
      (wrapper as HTMLElement & { dataset: DOMStringMap }).dataset.fullValue ?? '';
    const label = toggle.querySelector('.xml-attr-value-chip-label');
    const collapsedLabel =
      (toggle as HTMLElement & { dataset: DOMStringMap }).dataset.collapsedLabel ??
      label?.textContent ??
      '';
    const expanded = toggle.getAttribute('aria-expanded') === 'true';

    if (expanded) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', `Show full value (${collapsedLabel})`);
      if (label) label.textContent = collapsedLabel;
      if (
        markupLine?.nextElementSibling?.classList.contains('markup-embedded-uri-panel')
      ) {
        markupLine.nextElementSibling.remove();
      }
      return;
    }

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Hide full value');
    if (label) label.textContent = 'hide';
    if (
      !markupLine ||
      markupLine.nextElementSibling?.classList.contains('markup-embedded-uri-panel')
    ) {
      return;
    }
    const depth = Number(markupLine.style.getPropertyValue('--markup-depth') || 0);
    markupLine.insertAdjacentElement(
      'afterend',
      this._createEmbeddedUriContinuationPanel(fullValue, depth)
    );
  }

  /* prettier-ignore */
  private _renderXmlSpan(className: string, text: string, { ghost = false } = {}): TemplateResult {
    return ghost
      ? html`<span class="${className} markup-ghost-tag-part" title=${VIRTUAL_TEXT_TAG_HINT}>${text}</span>`
      : html`<span class=${className}>${text}</span>`;
  }

  /* prettier-ignore */
  private _renderMarkupLineRow(
    depth: number,
    content: unknown,
    { foldToggle = false } = {}
  ): TemplateResult {
    return html`<div class="markup-line" style="--markup-depth: ${depth}"><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true">${foldToggle ? html`<span class="markup-fold-toggle"></span>` : nothing}</span><span class="markup-line-body">${content}</span></span></div>`;
  }

  private _renderMarkupAttrValue(value: string): TemplateResult {
    if (isTruncatableEmbeddedImageUri(value)) {
      return this._renderTruncatableMarkupAttrValue(value);
    }
    return this._renderXmlSpan('xml-attr-value', value);
  }

  /* prettier-ignore */
  private _renderMarkupAttributes(
    attributes: { name: string; value: string }[]
  ): TemplateResult[] {
    return attributes.map(
      ({ name, value }) => html` ${this._renderXmlSpan('xml-attr-name', name)}${this._renderXmlSpan('xml-bracket', '="')}${this._renderMarkupAttrValue(value)}${this._renderXmlSpan('xml-bracket', '"')}`
    );
  }

  /* prettier-ignore */
  private _renderMarkupTextContent(text: string): TemplateResult {
    const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(text);
    if (cdataMatch) {
      return html`${this._renderXmlSpan('xml-cdata-delimiter', '<![CDATA[')}${this._renderXmlSpan('xml-cdata', cdataMatch[1] ?? '')}${this._renderXmlSpan('xml-cdata-delimiter', ']]>')}`;
    }
    return this._renderXmlSpan('xml-text', text);
  }

  /* prettier-ignore */
  private _renderOpenTagContent(
    tag: string,
    attributes: { name: string; value: string }[],
    ghost = false
  ): TemplateResult {
    return html`${this._renderXmlSpan('xml-bracket', '<', { ghost })}${this._renderXmlSpan('xml-tag', tag, { ghost })}${this._renderMarkupAttributes(attributes)}${this._renderXmlSpan('xml-bracket', '>', { ghost })}`;
  }

  /* prettier-ignore */
  private _renderMarkupFoldableOpen(
    depth: number,
    tag: string,
    attributes: { name: string; value: string }[],
    tagHint?: string
  ): TemplateResult {
    const ghost = Boolean(tagHint);
    const content = html`${this._renderOpenTagContent(tag, attributes, ghost)}<span class="markup-fold-suffix">${this._renderXmlSpan('xml-bracket', '...', { ghost })}${this._renderXmlSpan('xml-bracket', '</', { ghost })}${this._renderXmlSpan('xml-tag', tag, { ghost })}${this._renderXmlSpan('xml-bracket', '>', { ghost })}</span>`;
    return html`<summary class="markup-line markup-line-open" style="--markup-depth: ${depth}" @click=${this._onSummaryClick}><span class="markup-line-content"><span class="markup-gutter" aria-hidden="true"><span class="markup-fold-toggle"></span></span><span class="markup-line-body">${content}</span></span></summary>`;
  }

  /* prettier-ignore */
  private _renderMarkupCloseTag(
    depth: number,
    tag: string,
    tagHint?: string
  ): TemplateResult {
    const ghost = Boolean(tagHint);
    const content = html`${this._renderXmlSpan('xml-bracket', '</', { ghost })}${this._renderXmlSpan('xml-tag', tag, { ghost })}${this._renderXmlSpan('xml-bracket', '>', { ghost })}`;
    return this._renderMarkupLineRow(depth, content);
  }

  /* prettier-ignore */
  private _renderMarkupSelfClosingTag(
    depth: number,
    tag: string,
    attributes: { name: string; value: string }[]
  ): TemplateResult {
    const content = html`${this._renderXmlSpan('xml-bracket', '<')}${this._renderXmlSpan('xml-tag', tag)}${this._renderMarkupAttributes(attributes)}${this._renderXmlSpan('xml-bracket', '/>')}`;
    return this._renderMarkupLineRow(depth, content);
  }

  /* prettier-ignore */
  private _renderMarkupInlineElement(
    depth: number,
    tag: string,
    attributes: { name: string; value: string }[],
    text: string
  ): TemplateResult {
    const content = html`${this._renderOpenTagContent(tag, attributes)}${this._renderMarkupTextContent(text)}${this._renderXmlSpan('xml-bracket', '</')}${this._renderXmlSpan('xml-tag', tag)}${this._renderXmlSpan('xml-bracket', '>')}`;
    return this._renderMarkupLineRow(depth, content);
  }

  private _renderMarkupTextLine(depth: number, text: string): TemplateResult {
    return this._renderMarkupLineRow(depth, this._renderMarkupTextContent(text));
  }

  private _renderMarkupNodesFromSlice(
    depth: number,
    nodes: ArrayLike<ChildNode>,
    elementIds: Map<Element, string>
  ): TemplateResult[] {
    const templates: TemplateResult[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      const child = nodes[i];
      if (!child) continue;
      if (isTextLikeNode(child)) {
        const text = formatMarkupTextNode(child);
        if (text) {
          templates.push(this._renderMarkupTextLine(depth, text));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        templates.push(this._renderMarkupElement(child as Element, depth, elementIds));
      }
    }
    return templates;
  }

  /* prettier-ignore */
  private _renderMarkupVirtualText(
    depth: number,
    hostEl: Element,
    contentNodes: ChildNode[],
    elementIds: Map<Element, string>
  ): TemplateResult | TemplateResult[] | unknown {
    if (!shouldWrapVirtualText(contentNodes)) {
      return this._renderMarkupNodesFromSlice(depth, contentNodes, elementIds);
    }

    const elementId = elementIds.get(hostEl);

    return html`<details class="markup-el markup-el-foldable markup-el-virtual-text" ?open=${true} data-element-id=${elementId ?? nothing}>${this._renderMarkupFoldableOpen(depth, 'text', [], VIRTUAL_TEXT_TAG_HINT)}<div class="markup-fold-body"><div class="markup-children">${this._renderMarkupNodesFromSlice(depth + 1, contentNodes, elementIds)}</div>${this._renderMarkupCloseTag(depth, 'text', VIRTUAL_TEXT_TAG_HINT)}</div></details>`;
  }

  /* prettier-ignore */
  private _renderMarkupFoldableElement(
    el: Element,
    depth: number,
    elementIds: Map<Element, string>,
    renderBody: (childDepth: number) => TemplateResult | TemplateResult[] | unknown
  ): TemplateResult {
    const tag = localName(el);
    const elementId = elementIds.get(el);

    return html`<details class="markup-el markup-el-foldable" ?open=${true} data-element-id=${elementId ?? nothing}>${this._renderMarkupFoldableOpen(depth, tag, markupAttributes(el))}<div class="markup-fold-body"><div class="markup-children">${renderBody(depth + 1)}</div>${this._renderMarkupCloseTag(depth, tag)}</div></details>`;
  }

  private _renderMarkupList(
    el: Element,
    depth: number,
    elementIds: Map<Element, string>
  ): TemplateResult {
    return this._renderMarkupFoldableElement(el, depth, elementIds, childDepth => {
      const templates: unknown[] = [];
      const nodes = [...el.childNodes];
      let i = 0;
      while (i < nodes.length) {
        const node = nodes[i];
        if (!node) {
          i += 1;
          continue;
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          localName(node as Element) === 'ldiv'
        )
          break;
        if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
          i += 1;
          continue;
        }
        if (isTextLikeNode(node)) break;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = localName(node as Element);
          if (HEAD_TAGS.has(tag) || tag === 'location') {
            templates.push(
              this._renderMarkupElement(node as Element, childDepth, elementIds)
            );
            i += 1;
            continue;
          }
        }
        break;
      }
      while (i < nodes.length) {
        const node = nodes[i];
        if (!node) {
          i += 1;
          continue;
        }
        if (
          node.nodeType !== Node.ELEMENT_NODE ||
          localName(node as Element) !== 'ldiv'
        ) {
          templates.push(
            ...this._renderMarkupNodesFromSlice(childDepth, [node], elementIds)
          );
          i += 1;
          continue;
        }
        const ldiv = node as Element;
        templates.push(this._renderMarkupElement(ldiv, childDepth, elementIds));
        i += 1;
        const end = skipUntilListItemBoundary(nodes, i);
        templates.push(
          this._renderMarkupVirtualText(
            childDepth,
            ldiv,
            nodes.slice(i, end),
            elementIds
          )
        );
        i = end;
      }
      return templates;
    });
  }

  private _renderMarkupOtslContainer(
    el: Element,
    depth: number,
    elementIds: Map<Element, string>
  ): TemplateResult {
    return this._renderMarkupFoldableElement(el, depth, elementIds, childDepth => {
      const templates: unknown[] = [];
      const nodes = [...el.childNodes];
      let i = 0;
      while (i < nodes.length) {
        const node = nodes[i];
        if (!node) {
          i += 1;
          continue;
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          isCellToken(localName(node as Element))
        )
          break;
        if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) {
          i += 1;
          continue;
        }
        if (isTextLikeNode(node)) break;
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = localName(node as Element);
          if (HEAD_TAGS.has(tag) || tag === 'location' || tag === 'h_thread') {
            templates.push(
              this._renderMarkupElement(node as Element, childDepth, elementIds)
            );
            i += 1;
            continue;
          }
        }
        break;
      }
      while (i < nodes.length) {
        const node = nodes[i];
        if (!node) {
          i += 1;
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          templates.push(
            ...this._renderMarkupNodesFromSlice(childDepth, [node], elementIds)
          );
          i += 1;
          continue;
        }
        const tag = localName(node as Element);
        if (tag === 'nl') {
          templates.push(this._renderMarkupSelfClosingTag(childDepth, 'nl', []));
          i += 1;
          continue;
        }
        if (!isCellToken(tag)) {
          templates.push(
            ...this._renderMarkupNodesFromSlice(childDepth, [node], elementIds)
          );
          i += 1;
          continue;
        }
        const cell = node as Element;
        templates.push(this._renderMarkupElement(cell, childDepth, elementIds));
        i += 1;
        if (CELL_SPAN_TAGS.has(tag)) continue;
        const end = skipUntilCellBoundary(nodes, i);
        templates.push(
          this._renderMarkupVirtualText(
            childDepth,
            cell,
            nodes.slice(i, end),
            elementIds
          )
        );
        i = end;
      }
      return templates;
    });
  }

  /* prettier-ignore */
  private _renderMarkupElement(
    el: Element,
    depth: number,
    elementIds: Map<Element, string>
  ): TemplateResult {
    const tag = localName(el);
    if (tag === 'list') return this._renderMarkupList(el, depth, elementIds);
    if (OTSL_CONTAINER_TAGS.has(tag))
      return this._renderMarkupOtslContainer(el, depth, elementIds);

    const elementId = elementIds.get(el);
    const attributes = markupAttributes(el);

    if (!el.childNodes.length) {
      return html`<div class="markup-el" data-element-id=${elementId ?? nothing}>${this._renderMarkupSelfClosingTag(depth, tag, attributes)}</div>`;
    }

    const meaningfulText = [...el.childNodes].filter(
      n => isTextLikeNode(n) && !isWhitespaceOnlyText(n)
    );
    const textOnly =
      meaningfulText.length > 0 &&
      meaningfulText.every(isTextLikeNode) &&
      !childElements(el).length;
    if (textOnly) {
      const text = serializeMarkupTextNodes(el.childNodes);
      if (text) {
        return html`<div class="markup-el" data-element-id=${elementId ?? nothing}>${this._renderMarkupInlineElement(depth, tag, attributes, text)}</div>`;
      }
    }

    return html`<details class="markup-el markup-el-foldable" ?open=${true} data-element-id=${elementId ?? nothing}>${this._renderMarkupFoldableOpen(depth, tag, attributes)}<div class="markup-fold-body"><div class="markup-children">${[...el.childNodes].map(child => {
      if (isTextLikeNode(child)) {
        const text = formatMarkupTextNode(child);
        return text ? this._renderMarkupTextLine(depth + 1, text) : nothing;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        return this._renderMarkupElement(child as Element, depth + 1, elementIds);
      }
      return nothing;
    })}</div>${this._renderMarkupCloseTag(depth, tag)}</div></details>`;
  }
}
