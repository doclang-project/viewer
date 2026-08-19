/** <doclang-markup-pane> — DocLang XML markup view */

import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { DoclangPageElement } from '../base/page-element';
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
// Truncatable embedded URI helpers
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

function createEmbeddedUriContinuationPanel(value: string, depth: number): HTMLElement {
  const { line, content } = createMarkupLineRow(depth);
  line.className = 'markup-line markup-embedded-uri-panel';
  const body = document.createElement('div');
  body.className = 'markup-embedded-uri-panel-body';
  body.textContent = value;
  body.addEventListener('click', e => e.stopPropagation());
  content.appendChild(body);
  return line;
}

function createTruncatableMarkupAttrValue(value: string): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'xml-attr-value xml-attr-value-truncatable';
  (wrapper as HTMLElement & { dataset: DOMStringMap }).dataset.fullValue = value;

  const text = document.createElement('span');
  text.className = 'xml-attr-value-text';
  text.textContent = value.slice(0, LONG_EMBEDDED_URI_PREVIEW_LENGTH);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'xml-attr-value-chip';
  const sizeLabel = formatEmbeddedUriSizeLabel(value);
  toggle.dataset.collapsedLabel = sizeLabel;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', `Show full value (${sizeLabel})`);

  const label = document.createElement('span');
  label.className = 'xml-attr-value-chip-label';
  label.textContent = sizeLabel;
  toggle.appendChild(label);

  wrapper.append(text, toggle);
  return wrapper;
}

function toggleTruncatableMarkupAttrValue(toggle: Element): void {
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
    createEmbeddedUriContinuationPanel(fullValue, depth)
  );
}

// ---------------------------------------------------------------------------
// Low-level markup DOM builders
// ---------------------------------------------------------------------------

function xmlSpan(className: string, text: string, { ghost = false } = {}): HTMLElement {
  const span = document.createElement('span');
  span.className = ghost ? `${className} markup-ghost-tag-part` : className;
  span.textContent = text;
  return span;
}

function createMarkupLine(): HTMLDivElement {
  const line = document.createElement('div');
  line.className = 'markup-line';
  return line;
}

function createMarkupFoldToggle(): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'markup-fold-toggle';
  btn.setAttribute('aria-expanded', 'true');
  btn.setAttribute('aria-label', 'Collapse');
  return btn;
}

function createMarkupLineRow(
  depth: number,
  { foldToggle = false } = {}
): { line: HTMLDivElement; content: HTMLElement } {
  const line = createMarkupLine();
  line.style.setProperty('--markup-depth', String(depth));

  const row = document.createElement('span');
  row.className = 'markup-line-content';

  const gutter = document.createElement('span');
  gutter.className = 'markup-gutter';
  gutter.setAttribute('aria-hidden', 'true');
  if (foldToggle) gutter.appendChild(createMarkupFoldToggle());
  row.appendChild(gutter);

  const body = document.createElement('span');
  body.className = 'markup-line-body';
  row.appendChild(body);

  line.appendChild(row);
  return { line, content: body };
}

function appendMarkupAttrValue(line: HTMLElement, value: string): void {
  if (isTruncatableEmbeddedImageUri(value)) {
    line.appendChild(createTruncatableMarkupAttrValue(value));
  } else {
    line.appendChild(xmlSpan('xml-attr-value', value));
  }
}

function appendMarkupAttributes(
  line: HTMLElement,
  attributes: { name: string; value: string }[]
): void {
  for (const { name, value } of attributes) {
    line.appendChild(document.createTextNode(' '));
    line.appendChild(xmlSpan('xml-attr-name', name));
    line.appendChild(xmlSpan('xml-bracket', '="'));
    appendMarkupAttrValue(line, value);
    line.appendChild(xmlSpan('xml-bracket', '"'));
  }
}

function appendMarkupTextContent(line: HTMLElement, text: string): void {
  const cdataMatch = /^<!\[CDATA\[([\s\S]*)\]\]>$/.exec(text);
  if (cdataMatch) {
    line.appendChild(xmlSpan('xml-cdata-delimiter', '<![CDATA['));
    line.appendChild(xmlSpan('xml-cdata', cdataMatch[1] ?? ''));
    line.appendChild(xmlSpan('xml-cdata-delimiter', ']]>'));
    return;
  }
  line.appendChild(xmlSpan('xml-text', text));
}

function appendOpenTagContent(
  line: HTMLElement,
  tag: string,
  attributes: { name: string; value: string }[],
  ghost = false
): void {
  line.appendChild(xmlSpan('xml-bracket', '<', { ghost }));
  line.appendChild(xmlSpan('xml-tag', tag, { ghost }));
  appendMarkupAttributes(line, attributes);
  line.appendChild(xmlSpan('xml-bracket', '>', { ghost }));
}

function appendMarkupFoldableOpen(
  parent: HTMLElement,
  depth: number,
  tag: string,
  attributes: { name: string; value: string }[],
  tagHint?: string
): void {
  const ghost = Boolean(tagHint);
  const { line, content } = createMarkupLineRow(depth, { foldToggle: true });
  line.classList.add('markup-line-open');
  appendOpenTagContent(content, tag, attributes, ghost);

  const suffix = document.createElement('span');
  suffix.className = 'markup-fold-suffix';
  suffix.appendChild(xmlSpan('xml-bracket', '...', { ghost }));
  suffix.appendChild(xmlSpan('xml-bracket', '</', { ghost }));
  suffix.appendChild(xmlSpan('xml-tag', tag, { ghost }));
  suffix.appendChild(xmlSpan('xml-bracket', '>', { ghost }));
  content.appendChild(suffix);
  parent.appendChild(line);
}

function appendMarkupCloseTag(
  parent: HTMLElement,
  depth: number,
  tag: string,
  tagHint?: string
): void {
  const ghost = Boolean(tagHint);
  const { line, content } = createMarkupLineRow(depth);
  content.appendChild(xmlSpan('xml-bracket', '</', { ghost }));
  content.appendChild(xmlSpan('xml-tag', tag, { ghost }));
  content.appendChild(xmlSpan('xml-bracket', '>', { ghost }));
  parent.appendChild(line);
}

function appendMarkupSelfClosingTag(
  parent: HTMLElement,
  depth: number,
  tag: string,
  attributes: { name: string; value: string }[]
): void {
  const { line, content } = createMarkupLineRow(depth);
  content.appendChild(xmlSpan('xml-bracket', '<'));
  content.appendChild(xmlSpan('xml-tag', tag));
  appendMarkupAttributes(content, attributes);
  content.appendChild(xmlSpan('xml-bracket', '/>'));
  parent.appendChild(line);
}

function appendMarkupInlineElement(
  parent: HTMLElement,
  depth: number,
  tag: string,
  attributes: { name: string; value: string }[],
  text: string
): void {
  const { line, content } = createMarkupLineRow(depth);
  appendOpenTagContent(content, tag, attributes);
  appendMarkupTextContent(content, text);
  content.appendChild(xmlSpan('xml-bracket', '</'));
  content.appendChild(xmlSpan('xml-tag', tag));
  content.appendChild(xmlSpan('xml-bracket', '>'));
  parent.appendChild(line);
}

function appendMarkupTextLine(parent: HTMLElement, depth: number, text: string): void {
  const { line, content } = createMarkupLineRow(depth);
  appendMarkupTextContent(content, text);
  parent.appendChild(line);
}

// ---------------------------------------------------------------------------
// Slice / virtual-text helpers
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
// Element-level markup builders
// ---------------------------------------------------------------------------

function appendMarkupNodesFromSlice(
  parent: HTMLElement,
  depth: number,
  nodes: ArrayLike<ChildNode>,
  elementIds: Map<Element, string>
): void {
  for (let i = 0; i < nodes.length; i += 1) {
    const child = nodes[i];
    if (!child) continue;
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) appendMarkupTextLine(parent, depth, text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      parent.appendChild(buildMarkupElement(child as Element, depth, elementIds));
    }
  }
}

function appendMarkupVirtualText(
  parent: HTMLElement,
  depth: number,
  hostEl: Element,
  contentNodes: ChildNode[],
  elementIds: Map<Element, string>
): void {
  if (!shouldWrapVirtualText(contentNodes)) {
    appendMarkupNodesFromSlice(parent, depth, contentNodes, elementIds);
    return;
  }

  const block = document.createElement('div');
  block.className = 'markup-el markup-el-virtual-text';
  const elementId = elementIds.get(hostEl);
  if (elementId) block.setAttribute('data-element-id', elementId);

  appendMarkupFoldableOpen(block, depth, 'text', [], VIRTUAL_TEXT_TAG_HINT);
  block.classList.add('markup-el-foldable');

  const foldBody = document.createElement('div');
  foldBody.className = 'markup-fold-body';
  const children = document.createElement('div');
  children.className = 'markup-children';
  appendMarkupNodesFromSlice(children, depth + 1, contentNodes, elementIds);
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, 'text', VIRTUAL_TEXT_TAG_HINT);
  block.appendChild(foldBody);
  parent.appendChild(block);
}

function buildMarkupFoldableElement(
  el: Element,
  depth: number,
  elementIds: Map<Element, string>,
  buildBody: (children: HTMLElement, childDepth: number) => void
): HTMLElement {
  const tag = localName(el);
  const block = document.createElement('div');
  block.className = 'markup-el';
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute('data-element-id', elementId);

  const attributes = markupAttributes(el);
  appendMarkupFoldableOpen(block, depth, tag, attributes);
  block.classList.add('markup-el-foldable');

  const foldBody = document.createElement('div');
  foldBody.className = 'markup-fold-body';
  const children = document.createElement('div');
  children.className = 'markup-children';
  buildBody(children, depth + 1);
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, tag);
  block.appendChild(foldBody);
  return block;
}

function buildMarkupList(
  el: Element,
  depth: number,
  elementIds: Map<Element, string>
): HTMLElement {
  return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
    const nodes = [...el.childNodes];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (!node) { i += 1; continue; }
      if (node.nodeType === Node.ELEMENT_NODE && localName(node as Element) === 'ldiv')
        break;
      if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) { i += 1; continue; }
      if (isTextLikeNode(node)) break;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = localName(node as Element);
        if (HEAD_TAGS.has(tag) || tag === 'location') {
          children.appendChild(buildMarkupElement(node as Element, childDepth, elementIds));
          i += 1;
          continue;
        }
      }
      break;
    }
    while (i < nodes.length) {
      const node = nodes[i];
      if (!node) { i += 1; continue; }
      if (node.nodeType !== Node.ELEMENT_NODE || localName(node as Element) !== 'ldiv') {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const ldiv = node as Element;
      children.appendChild(buildMarkupElement(ldiv, childDepth, elementIds));
      i += 1;
      const end = skipUntilListItemBoundary(nodes, i);
      appendMarkupVirtualText(children, childDepth, ldiv, nodes.slice(i, end), elementIds);
      i = end;
    }
  });
}

function buildMarkupOtslContainer(
  el: Element,
  depth: number,
  elementIds: Map<Element, string>
): HTMLElement {
  return buildMarkupFoldableElement(el, depth, elementIds, (children, childDepth) => {
    const nodes = [...el.childNodes];
    let i = 0;
    while (i < nodes.length) {
      const node = nodes[i];
      if (!node) { i += 1; continue; }
      if (node.nodeType === Node.ELEMENT_NODE && isCellToken(localName(node as Element)))
        break;
      if (isTextLikeNode(node) && isWhitespaceOnlyText(node)) { i += 1; continue; }
      if (isTextLikeNode(node)) break;
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = localName(node as Element);
        if (HEAD_TAGS.has(tag) || tag === 'location' || tag === 'h_thread') {
          children.appendChild(buildMarkupElement(node as Element, childDepth, elementIds));
          i += 1;
          continue;
        }
      }
      break;
    }
    while (i < nodes.length) {
      const node = nodes[i];
      if (!node) { i += 1; continue; }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const tag = localName(node as Element);
      if (tag === 'nl') {
        appendMarkupSelfClosingTag(children, childDepth, 'nl', []);
        i += 1;
        continue;
      }
      if (!isCellToken(tag)) {
        appendMarkupNodesFromSlice(children, childDepth, [node], elementIds);
        i += 1;
        continue;
      }
      const cell = node as Element;
      children.appendChild(buildMarkupElement(cell, childDepth, elementIds));
      i += 1;
      if (CELL_SPAN_TAGS.has(tag)) continue;
      const end = skipUntilCellBoundary(nodes, i);
      appendMarkupVirtualText(children, childDepth, cell, nodes.slice(i, end), elementIds);
      i = end;
    }
  });
}

function buildMarkupElement(
  el: Element,
  depth: number,
  elementIds: Map<Element, string>
): HTMLElement {
  const tag = localName(el);
  if (tag === 'list') return buildMarkupList(el, depth, elementIds);
  if (OTSL_CONTAINER_TAGS.has(tag)) return buildMarkupOtslContainer(el, depth, elementIds);

  const block = document.createElement('div');
  block.className = 'markup-el';
  const elementId = elementIds.get(el);
  if (elementId) block.setAttribute('data-element-id', elementId);

  const attributes = markupAttributes(el);

  if (!el.childNodes.length) {
    appendMarkupSelfClosingTag(block, depth, tag, attributes);
    return block;
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
      appendMarkupInlineElement(block, depth, tag, attributes, text);
      return block;
    }
  }

  appendMarkupFoldableOpen(block, depth, tag, attributes);
  block.classList.add('markup-el-foldable');

  const foldBody = document.createElement('div');
  foldBody.className = 'markup-fold-body';
  const children = document.createElement('div');
  children.className = 'markup-children';
  for (const child of el.childNodes) {
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) appendMarkupTextLine(children, depth + 1, text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.appendChild(buildMarkupElement(child as Element, depth + 1, elementIds));
    }
  }
  foldBody.appendChild(children);
  appendMarkupCloseTag(foldBody, depth, tag);
  block.appendChild(foldBody);
  return block;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('doclang-markup-pane')
export class DoclangMarkupPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  // null = no document loaded yet; false = document loaded but no markup; true = has markup
  @state() private _hasMarkup: boolean | null = null;
  private _pendingContent: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-markup');
    this.addEventListener('mousemove', this._onMousemove);
    this.addEventListener('mouseleave', this._onMouseleave);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mousemove', this._onMousemove);
    this.removeEventListener('mouseleave', this._onMouseleave);
  }

  override render() {
    return html`
      <div class="pane-header">DocLang</div>
      <div class="pane-body" id="markup-pane" @click=${this._onBodyClick}>
        ${this._hasMarkup === false
          ? html`<div class="placeholder">${NO_MARKUP}</div>`
          : this._hasMarkup === true
            ? html`<div ${ref(this._onContentRef)}></div>`
            : nothing}
      </div>
    `;
  }

  private _onContentRef = (el: Element | undefined): void => {
    if (el && this._pendingContent) {
      (el as HTMLElement).replaceChildren(this._pendingContent);
    }
  };

  override updated(): void {
    if (!this._pendingContent) return;
    const wrapper = this.shadowRoot?.querySelector('.pane-body > div') as HTMLElement | null;
    if (wrapper && !wrapper.contains(this._pendingContent)) {
      wrapper.replaceChildren(this._pendingContent);
    }
  }

  /** The scrollable content body inside the shadow root. */
  get scrollPane(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.pane-body') ?? null;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  protected override _applySelection(): void {
    if (!this.shadowRoot) return;
    for (const el of this.shadowRoot.querySelectorAll('.markup-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this._selectedId) return;
    const target =
      this.shadowRoot.querySelector(
        `.markup-el-virtual-text[data-element-id="${this._selectedId}"]`
      ) ??
      this.shadowRoot.querySelector(`[data-element-id="${this._selectedId}"]`);
    if (target) {
      target.classList.add('selected');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  protected override _renderDocument(): void {
    const state = this._docState;
    if (!state) {
      this._pendingContent = null;
      this._hasMarkup = null;
      return;
    }

    const segment = state.segments[this._currentPage - 1] ?? [];
    const elementIds = assignElementIds(segment);
    state.elementIds = elementIds;
    state.idToElement = invertElementIds(elementIds);

    if (segmentHasMarkup(segment)) {
      this._pendingContent = this._buildMarkupView(segment, elementIds);
      this._hasMarkup = true;
    } else {
      this._pendingContent = null;
      this._hasMarkup = false;
    }
    this.requestUpdate();
  }

  protected override _clearDocument(): void {
    this._pendingContent = null;
    this._hasMarkup = null;
    this.requestUpdate();
  }

  private _buildMarkupView(
    segment: Element[],
    elementIds: Map<Element, string>
  ): HTMLElement {
    const root = document.createElement('div');
    root.className = 'markup';
    for (const el of segment) {
      if (el.nodeType === Node.ELEMENT_NODE) {
        root.appendChild(buildMarkupElement(el, 0, elementIds));
      }
    }
    return root;
  }

  private _onBodyClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    const attrToggle = target.closest('.xml-attr-value-chip');
    if (attrToggle) {
      e.stopPropagation();
      toggleTruncatableMarkupAttrValue(attrToggle);
      return;
    }
    const toggle = target.closest('.markup-fold-toggle');
    if (toggle) {
      e.stopPropagation();
      const block = toggle.closest('.markup-el-foldable');
      if (block) {
        const collapsed = block.classList.toggle('markup-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Expand' : 'Collapse');
      }
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

  private _onMousemove = (e: MouseEvent): void => {
    if (!(e.target as Element).closest('.markup-ghost-tag-part')) {
      this._hideHint();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('doclang-hint', {
        bubbles: true,
        composed: true,
        detail: {
          text: VIRTUAL_TEXT_TAG_HINT,
          clientX: e.clientX,
          clientY: e.clientY,
        },
      })
    );
  };

  private _onMouseleave = (): void => this._hideHint();

  private _hideHint(): void {
    this.dispatchEvent(
      new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
    );
  }
}
