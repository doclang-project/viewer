/** <doclang-reading-pane> — reading/rendered view with layers settings panel */

import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';
import { DoclangPageElement } from '../base/page-element';
import styles from './reading-pane.css?inline';
import { segmentHasMarkup, assignElementIds, NO_MARKUP } from '../../doclang/document';
import {
  HEAD_TAGS,
  CELL_SPAN_TAGS,
  isTextLikeNode,
  isWhitespaceOnlyText,
  localName,
  childElements,
  isCellToken,
  headingLevel,
  parseElementHeadAt,
  skipElementHeadNodes,
  skipContainerLevelHead,
  skipUntilCellBoundary,
  skipOtslContainerHead,
  elementLayer,
  elementThreadId,
  normalizeArchivePath,
  isSemanticElement,
} from '../../doclang/dom';
import type { RenderCtx, OtslCell, ParsedOtslCell } from '../../doclang/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RENDER_BLOCK_TAGS = new Set([
  'text',
  'heading',
  'field_heading',
  'footnote',
  'page_header',
  'page_footer',
  'list',
  'code',
  'formula',
  'picture',
  'group',
  'field_region',
  'field_item',
  'table',
  'index',
  'tabular',
]);
const RENDER_FORMAT_TAGS = new Set([
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'superscript',
  'subscript',
  'handwriting',
  'rtl',
  'content',
]);
const FORMAT_HTML_TAG: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  underline: 'u',
  strikethrough: 's',
  superscript: 'sup',
  subscript: 'sub',
};
const PICTURE_UNAVAILABLE_ALT = 'Picture asset not available';
const INVALID_PICTURE_SRC = 'data:image/png;base64,NOT_A_VALID_IMAGE';
/** Allow small embedded raster data URIs only; remote/blob/other schemes are rejected. */
const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp|gif);base64,/i;
const MAX_DATA_IMAGE_URI_LENGTH = 2 * 1024 * 1024; // 2 MiB

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function applyElementLayerAttr(sourceEl: Element, domEl: HTMLElement): void {
  domEl.setAttribute('data-doclang-layer', elementLayer(sourceEl));
}

function resolveArchiveUri(
  uri: string | null | undefined,
  assetUrls: Map<string, string> | undefined
): string | null {
  if (!uri) return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (SAFE_DATA_IMAGE_RE.test(trimmed)) {
    return trimmed.length <= MAX_DATA_IMAGE_URI_LENGTH ? trimmed : null;
  }
  // Reject any other scheme (http, https, blob, javascript, …) and protocol-relative URLs.
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) return null;

  return assetUrls?.get(normalizeArchivePath(trimmed)) ?? null;
}

function markPictureUnavailable(img: HTMLImageElement): void {
  img.classList.add('rendered-picture-unavailable');
  img.alt = '\u00A0';
  img.setAttribute('aria-label', PICTURE_UNAVAILABLE_ALT);
}

function appendPictureFigureImage(
  figure: HTMLElement,
  uri: string | null,
  captionEl: Element | null,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  const img = document.createElement('img');
  figure.appendChild(img);

  const resolved = uri ? resolveArchiveUri(uri, assetUrls) : null;
  if (resolved) {
    img.alt = '';
    img.src = resolved;
    img.addEventListener('error', () => markPictureUnavailable(img), { once: true });
  } else {
    markPictureUnavailable(img);
    img.src = INVALID_PICTURE_SRC;
  }

  if (captionEl) {
    figure.appendChild(renderEmbeddedCaption(captionEl, elementIds, 'figcaption', assetUrls));
  }
}

function readCaptionElement(el: Element): Element | null {
  return childElements(el).find(c => localName(c) === 'caption') ?? null;
}

function renderEmbeddedCaption(
  captionEl: Element,
  elementIds: Map<Element, string>,
  tagName: string,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const node = document.createElement(tagName);
  node.classList.add('rendered-el', 'rendered-caption');
  const elementId = elementIds.get(captionEl);
  if (elementId) node.setAttribute('data-element-id', elementId);
  appendRenderedBody(node, captionEl, elementIds, { inline: true }, assetUrls);
  return node;
}

function wrapRendered(
  el: Element,
  node: HTMLElement,
  elementId: string | undefined,
  extraClass?: string
): HTMLElement {
  const tag = localName(el);
  const wrap = document.createElement('div');
  wrap.className = `rendered-el rendered-${tag}${extraClass ? ` ${extraClass}` : ''}`;
  if (elementId) wrap.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(el, wrap);
  wrap.appendChild(node);
  return wrap;
}

function appendRenderedBody(
  parent: HTMLElement,
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls?: Map<string, string>
): void {
  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    appendRenderedNode(parent, nodes[i]!, elementIds, ctx, assetUrls);
    i += 1;
  }
}

function appendRenderedBodyBlocks(
  parent: HTMLElement,
  el: Element,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      RENDER_BLOCK_TAGS.has(localName(node as Element))
    ) {
      const rendered = renderBlockElement(node as Element, elementIds, { inline: false }, assetUrls);
      if (rendered) parent.appendChild(rendered);
    } else {
      appendRenderedNode(parent, node, elementIds, { inline: false }, assetUrls);
    }
    i += 1;
  }
}

function renderMarkerElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const marker = document.createElement('span');
  marker.className = 'rendered-marker rendered-el';
  const elementId = elementIds.get(el);
  if (elementId) marker.setAttribute('data-element-id', elementId);
  appendRenderedBody(marker, el, elementIds, ctx, assetUrls);
  return marker;
}

function renderCheckboxElement(
  el: Element,
  elementIds: Map<Element, string>
): HTMLElement {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.disabled = true;
  cb.checked = (el.getAttribute('class') ?? 'unselected') === 'selected';
  cb.className = 'rendered-checkbox';

  const wrap = document.createElement('span');
  wrap.className = 'rendered-checkbox-wrap rendered-el';
  const elementId = elementIds.get(el);
  if (elementId) wrap.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(el, wrap);
  wrap.appendChild(cb);
  return wrap;
}

function renderFieldKeyElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const node = document.createElement('span');
  node.className = 'rendered-field-key rendered-el';
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true }, assetUrls);
  return node;
}

function renderFieldValueElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const valueClass = el.getAttribute('class') ?? 'read_only';
  const node = document.createElement('span');
  node.className = `rendered-field-value rendered-field-value-${valueClass} rendered-el`;
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true }, assetUrls);
  if (
    valueClass === 'fillable' &&
    !node.textContent?.trim() &&
    !node.querySelector('.rendered-checkbox-wrap, img, .rendered-marker')
  ) {
    const slot = document.createElement('span');
    slot.className = 'rendered-field-fillable-slot';
    slot.setAttribute('aria-hidden', 'true');
    node.appendChild(slot);
  }
  return node;
}

function renderFieldHintElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const node = document.createElement('span');
  node.className = 'rendered-field-hint rendered-el';
  const elementId = elementIds.get(el);
  if (elementId) node.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(el, node);
  appendRenderedBody(node, el, elementIds, { ...ctx, inline: true }, assetUrls);
  return node;
}

function renderFormatElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const tag = localName(el);
  if (tag === 'content') {
    const span = document.createElement('span');
    span.textContent = el.textContent ?? '';
    return span;
  }

  let node: HTMLElement;
  if (tag === 'handwriting') {
    node = document.createElement('span');
    node.className = 'rendered-handwriting';
  } else if (tag === 'rtl') {
    node = document.createElement('bdi');
    node.setAttribute('dir', 'rtl');
  } else {
    node = document.createElement(FORMAT_HTML_TAG[tag] ?? 'span');
  }

  appendRenderedBody(node, el, elementIds, ctx, assetUrls);
  return node;
}

function renderCode(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const labelEl = childElements(el).find(c => localName(c) === 'label');
  const labelValue = labelEl?.getAttribute('value');

  const code = document.createElement('code');
  appendRenderedBody(code, el, elementIds, { inline: ctx.inline }, assetUrls);

  if (ctx.inline) {
    code.classList.add('rendered-el');
    const id = elementIds.get(el);
    if (id) code.setAttribute('data-element-id', id);
    return code;
  }

  const pre = document.createElement('pre');
  if (labelValue && labelValue !== 'undefined') {
    const label = document.createElement('span');
    label.className = 'rendered-code-label';
    label.textContent = labelValue;
    pre.appendChild(label);
  }
  pre.appendChild(code);
  return wrapRendered(el, pre, elementIds.get(el));
}

function renderFormula(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const span = document.createElement('span');
  span.className = ctx.inline ? 'rendered-formula-inline' : 'rendered-formula';
  appendRenderedBody(span, el, elementIds, { inline: true }, assetUrls);
  if (ctx.inline) {
    span.classList.add('rendered-el');
    const id = elementIds.get(el);
    if (id) span.setAttribute('data-element-id', id);
    return span;
  }
  return wrapRendered(el, span, elementIds.get(el));
}

function renderPicture(
  el: Element,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const figure = document.createElement('figure');
  const captionEl = readCaptionElement(el);
  const srcEl = childElements(el).find(c => localName(c) === 'src') ?? null;
  const uri = srcEl?.getAttribute('uri')?.trim() || null;

  appendPictureFigureImage(figure, uri, captionEl, elementIds, assetUrls);

  const nodes = [...el.childNodes];
  let i = skipElementHeadNodes(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE) { i += 1; continue; }
    const tag = localName(node as Element);
    if (tag === 'src') { i += 1; continue; }
    if (tag === 'tabular') {
      const rendered = renderOtslContainer(node as Element, elementIds, assetUrls);
      if (rendered) figure.appendChild(rendered);
      i += 1;
      continue;
    }
    break;
  }

  const bodyInner = document.createElement('div');
  bodyInner.className = 'rendered-picture-contents-body';
  appendPictureBodyContent(bodyInner, nodes, i, elementIds, assetUrls);
  if (bodyInner.textContent?.trim()) {
    const details = document.createElement('details');
    details.className = 'rendered-picture-contents';
    const summary = document.createElement('summary');
    summary.textContent = 'Picture contents';
    details.appendChild(summary);
    details.appendChild(bodyInner);
    figure.appendChild(details);
  }

  return wrapRendered(el, figure, elementIds.get(el));
}

function appendPictureBodyContent(
  container: HTMLElement,
  nodes: ChildNode[],
  startIdx: number,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      RENDER_BLOCK_TAGS.has(localName(node as Element))
    ) {
      const rendered = renderBlockElement(node as Element, elementIds, { inline: false }, assetUrls);
      if (rendered) container.appendChild(rendered);
    } else {
      appendRenderedNode(container, node, elementIds, { inline: false }, assetUrls);
    }
    i += 1;
  }
}

function renderVirtualTextBlock(
  hostEl: Element,
  contentNodes: ChildNode[],
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const hasBlock = contentNodes.some(
    n =>
      n.nodeType === Node.ELEMENT_NODE && RENDER_BLOCK_TAGS.has(localName(n as Element))
  );
  const inner = document.createElement(hasBlock ? 'div' : 'p');
  for (const node of contentNodes) {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      RENDER_BLOCK_TAGS.has(localName(node as Element))
    ) {
      const rendered = renderBlockElement(node as Element, elementIds, { inline: false }, assetUrls);
      if (rendered) inner.appendChild(rendered);
    } else {
      appendRenderedNode(inner, node, elementIds, { inline: true }, assetUrls);
    }
  }
  const wrap = document.createElement('div');
  wrap.className = 'rendered-el rendered-text rendered-el-virtual-text';
  const elementId = elementIds.get(hostEl);
  if (elementId) wrap.setAttribute('data-element-id', elementId);
  applyElementLayerAttr(hostEl, wrap);
  wrap.appendChild(inner);
  return wrap;
}

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

function appendRenderedSliceContent(
  container: HTMLElement,
  hostEl: Element,
  contentNodes: ChildNode[],
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  if (!sliceHasMarkupContent(contentNodes)) return;
  if (shouldWrapVirtualText(contentNodes)) {
    container.appendChild(
      renderVirtualTextBlock(hostEl, contentNodes, elementIds, assetUrls)
    );
    return;
  }
  for (const node of contentNodes) {
    if (isVirtualTextSkippableNode(node)) continue;
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      RENDER_BLOCK_TAGS.has(localName(node as Element))
    ) {
      const rendered = renderBlockElement(node as Element, elementIds, { inline: false }, assetUrls);
      if (rendered) container.appendChild(rendered);
    } else {
      appendRenderedNode(container, node, elementIds, { inline: true }, assetUrls);
    }
  }
}

function appendListItemsFromElement(
  list: HTMLElement,
  el: Element,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  const nodes = [...el.childNodes];
  let i = skipContainerLevelHead(nodes, 0);

  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node as Element) !== 'ldiv') {
      i += 1;
      continue;
    }

    const ldiv = node as Element;
    i += 1;
    const li = document.createElement('li');

    for (const child of childElements(ldiv)) {
      const childTag = localName(child);
      if (childTag === 'marker') {
        li.appendChild(renderMarkerElement(child, elementIds, { inline: true }, assetUrls));
      } else if (childTag === 'checkbox') {
        li.appendChild(renderCheckboxElement(child, elementIds));
      }
    }

    const contentStart = i;
    const head = parseElementHeadAt(nodes, i);
    if (head) i = head.nextIndex;

    while (i < nodes.length) {
      const contentNode = nodes[i]!;
      if (
        contentNode.nodeType === Node.ELEMENT_NODE &&
        localName(contentNode as Element) === 'ldiv'
      )
        break;
      i += 1;
    }

    const contentNodes = nodes.slice(contentStart, i);
    appendRenderedSliceContent(li, ldiv, contentNodes, elementIds, assetUrls);

    list.appendChild(li);
  }
}

function renderList(
  el: Element,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const listClass = el.getAttribute('class') ?? 'unordered';
  const list = document.createElement(listClass === 'ordered' ? 'ol' : 'ul');
  appendListItemsFromElement(list, el, elementIds, assetUrls);
  return wrapRendered(el, list, elementIds.get(el));
}

function isHeaderCellKind(kind: string): boolean {
  return kind === 'ched' || kind === 'rhed' || kind === 'corn' || kind === 'srow';
}

function parseOtslRows(container: Element): ParsedOtslCell[][] {
  const nodes = [...container.childNodes];
  let i = skipOtslContainerHead(nodes, 0);
  const rows: ParsedOtslCell[][] = [];
  let currentRow: ParsedOtslCell[] = [];

  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE) { i += 1; continue; }
    const tag = localName(node as Element);
    if (tag === 'nl') {
      rows.push(currentRow);
      currentRow = [];
      i += 1;
      continue;
    }
    if (!isCellToken(tag)) { i += 1; continue; }

    if (CELL_SPAN_TAGS.has(tag)) {
      currentRow.push({ kind: tag, token: node as Element, contentNodes: [] });
      i += 1;
      continue;
    }

    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) i = head.nextIndex;
    const contentStart = i;
    i = skipUntilCellBoundary(nodes, i);
    currentRow.push({
      kind: tag,
      token: node as Element,
      contentNodes: nodes.slice(contentStart, i),
    });
  }

  if (currentRow.length) rows.push(currentRow);
  return rows;
}

function findVerticalCellOrigin(
  grid: (OtslCell | undefined)[][],
  row: number,
  col: number
): { cell: OtslCell; row: number; col: number } | null {
  for (let r = row - 1; r >= 0; r -= 1) {
    const cell = grid[r]?.[col];
    if (!cell || cell.covered) continue;
    return { cell, row: r, col };
  }
  return null;
}

function findHorizontalCellOrigin(
  grid: (OtslCell | undefined)[][],
  row: number,
  col: number
): { cell: OtslCell; row: number; col: number } | null {
  for (let c = col - 1; c >= 0; c -= 1) {
    const cell = grid[row]?.[c];
    if (!cell || cell.covered) continue;
    return { cell, row, col: c };
  }
  return null;
}

function nextFreeColumn(
  grid: (OtslCell | undefined)[][],
  row: number,
  col: number
): number {
  let c = col;
  while (grid[row]?.[c]?.covered) c += 1;
  return c;
}

function buildOtslGrid(rows: ParsedOtslCell[][]): (OtslCell | undefined)[][] {
  const grid: (OtslCell | undefined)[][] = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    if (!grid[rowIdx]) grid[rowIdx] = [];
    let col = 0;

    for (const parsed of rows[rowIdx]!) {
      col = nextFreeColumn(grid, rowIdx, col);

      if (parsed.kind === 'lcel') {
        const origin = findHorizontalCellOrigin(grid, rowIdx, col);
        if (origin) origin.cell.colspan += 1;
        grid[rowIdx]![col] = {
          kind: 'lcel',
          token: parsed.token,
          contentNodes: [],
          colspan: 0,
          rowspan: 0,
          covered: true,
        };
        col += 1;
        continue;
      }

      if (parsed.kind === 'ucel') {
        const origin = findVerticalCellOrigin(grid, rowIdx, col);
        if (origin) origin.cell.rowspan += 1;
        grid[rowIdx]![col] = {
          kind: 'ucel',
          token: parsed.token,
          contentNodes: [],
          colspan: 0,
          rowspan: 0,
          covered: true,
        };
        col += 1;
        continue;
      }

      if (parsed.kind === 'xcel') {
        const vOrigin = findVerticalCellOrigin(grid, rowIdx, col);
        const hOrigin = findHorizontalCellOrigin(grid, rowIdx, col);
        if (vOrigin && hOrigin && vOrigin.cell === hOrigin.cell) {
          vOrigin.cell.rowspan += 1;
          vOrigin.cell.colspan += 1;
        } else {
          if (vOrigin) vOrigin.cell.rowspan += 1;
          if (hOrigin) hOrigin.cell.colspan += 1;
        }
        grid[rowIdx]![col] = {
          kind: 'xcel',
          token: parsed.token,
          contentNodes: [],
          colspan: 0,
          rowspan: 0,
          covered: true,
        };
        col += 1;
        continue;
      }

      grid[rowIdx]![col] = {
        kind: parsed.kind,
        token: parsed.token,
        contentNodes: parsed.contentNodes,
        colspan: 1,
        rowspan: 1,
        covered: false,
      };
      col += 1;
    }
  }

  return grid;
}

function renderOtslContainer(
  el: Element,
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const table = document.createElement('table');
  table.className = 'rendered-table';

  const captionEl = readCaptionElement(el);
  if (captionEl) {
    table.appendChild(renderEmbeddedCaption(captionEl, elementIds, 'caption', assetUrls));
  }

  const grid = buildOtslGrid(parseOtslRows(el));
  const tbody = document.createElement('tbody');

  for (const row of grid) {
    const tr = document.createElement('tr');
    for (const cell of row ?? []) {
      if (!cell || cell.covered) continue;
      const cellTag = isHeaderCellKind(cell.kind) ? 'th' : 'td';
      const td = document.createElement(cellTag);
      if (cell.colspan > 1) td.colSpan = cell.colspan;
      if (cell.rowspan > 1) td.rowSpan = cell.rowspan;
      appendRenderedSliceContent(
        td,
        cell.token,
        cell.contentNodes as ChildNode[],
        elementIds,
        assetUrls
      );
      tr.appendChild(td);
    }
    if (tr.childNodes.length) tbody.appendChild(tr);
  }

  if (tbody.childNodes.length) table.appendChild(tbody);
  return wrapRendered(el, table, elementIds.get(el));
}

function renderUnsupported(el: Element, elementIds: Map<Element, string>): HTMLElement {
  const stub = document.createElement('div');
  stub.className = 'rendered-unsupported';
  stub.textContent = `<${localName(el)}> — not yet rendered`;
  return wrapRendered(el, stub, elementIds.get(el));
}

function renderBlockElement(
  el: Element,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls?: Map<string, string>
): HTMLElement | null {
  const tag = localName(el);
  const elementId = elementIds.get(el);

  switch (tag) {
    case 'text': {
      const p = document.createElement('p');
      appendRenderedBody(p, el, elementIds, { inline: true }, assetUrls);
      return wrapRendered(el, p, elementId);
    }
    case 'heading': {
      const h = document.createElement(`h${headingLevel(el)}`);
      appendRenderedBody(h, el, elementIds, { inline: true }, assetUrls);
      return wrapRendered(el, h, elementId);
    }
    case 'field_heading': {
      const h = document.createElement(`h${headingLevel(el)}`);
      h.className = 'rendered-field-heading';
      appendRenderedBody(h, el, elementIds, { inline: true }, assetUrls);
      return wrapRendered(el, h, elementId);
    }
    case 'footnote': {
      const aside = document.createElement('aside');
      appendRenderedBody(aside, el, elementIds, { inline: false }, assetUrls);
      return wrapRendered(el, aside, elementId);
    }
    case 'page_header': {
      const header = document.createElement('header');
      header.className = 'rendered-page-header';
      appendRenderedBody(header, el, elementIds, { inline: true }, assetUrls);
      return wrapRendered(el, header, elementId);
    }
    case 'page_footer': {
      const footer = document.createElement('footer');
      footer.className = 'rendered-page-footer';
      appendRenderedBody(footer, el, elementIds, { inline: true }, assetUrls);
      return wrapRendered(el, footer, elementId);
    }
    case 'list':
      return renderList(el, elementIds, assetUrls);
    case 'table':
    case 'index':
    case 'tabular':
      return renderOtslContainer(el, elementIds, assetUrls);
    case 'code':
      return renderCode(el, elementIds, ctx, assetUrls);
    case 'formula':
      return renderFormula(el, elementIds, ctx, assetUrls);
    case 'picture':
      return renderPicture(el, elementIds, assetUrls);
    case 'group': {
      const figure = document.createElement('figure');
      figure.className = 'rendered-group';
      appendRenderedBodyBlocks(figure, el, elementIds, assetUrls);
      const cap = readCaptionElement(el);
      if (cap) figure.appendChild(renderEmbeddedCaption(cap, elementIds, 'figcaption', assetUrls));
      return wrapRendered(el, figure, elementId);
    }
    case 'field_region': {
      const div = document.createElement('div');
      div.className = 'rendered-field-region';
      appendRenderedBodyBlocks(div, el, elementIds, assetUrls);
      return wrapRendered(el, div, elementId);
    }
    case 'field_item': {
      const div = document.createElement('div');
      div.className = 'rendered-field-item';
      appendRenderedBodyBlocks(div, el, elementIds, assetUrls);
      return wrapRendered(el, div, elementId);
    }
    default:
      return renderUnsupported(el, elementIds);
  }
}

function appendRenderedNode(
  parent: HTMLElement,
  node: ChildNode,
  elementIds: Map<Element, string>,
  ctx: RenderCtx,
  assetUrls?: Map<string, string>
): void {
  if (isTextLikeNode(node)) {
    let text = node.textContent;
    if (!text || !text.trim()) return;
    if (ctx.trimLeading) {
      text = text.replace(/^\s+/u, '');
      ctx.trimLeading = false;
      if (!text) return;
    }
    parent.appendChild(document.createTextNode(text));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as Element;
  const tag = localName(el);
  if (HEAD_TAGS.has(tag)) return;

  if (RENDER_FORMAT_TAGS.has(tag)) {
    parent.appendChild(renderFormatElement(el, elementIds, ctx, assetUrls));
    return;
  }

  if (tag === 'code' || tag === 'formula') {
    const rendered = renderBlockElement(el, elementIds, { inline: true }, assetUrls);
    if (rendered) parent.appendChild(rendered);
    return;
  }

  if (RENDER_BLOCK_TAGS.has(tag)) {
    const rendered = renderBlockElement(el, elementIds, ctx, assetUrls);
    if (rendered) parent.appendChild(rendered);
    return;
  }

  if (tag === 'marker') {
    parent.appendChild(renderMarkerElement(el, elementIds, ctx, assetUrls));
    return;
  }

  if (tag === 'checkbox') {
    parent.appendChild(renderCheckboxElement(el, elementIds));
    return;
  }

  if (tag === 'key') {
    parent.appendChild(renderFieldKeyElement(el, elementIds, ctx, assetUrls));
    return;
  }

  if (tag === 'value') {
    parent.appendChild(renderFieldValueElement(el, elementIds, ctx, assetUrls));
    return;
  }

  if (tag === 'hint') {
    parent.appendChild(renderFieldHintElement(el, elementIds, ctx, assetUrls));
    return;
  }

  if (tag === 'ldiv') return;
  if (isCellToken(tag) || tag === 'src' || tag === 'tabular') return;

  appendRenderedBody(parent, el, elementIds, ctx, assetUrls);
}

// ---------------------------------------------------------------------------
// Fragment merge helpers
// ---------------------------------------------------------------------------

function findLastTextNode(node: Node): Node | null {
  if (isTextLikeNode(node)) return node;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  for (let i = node.childNodes.length - 1; i >= 0; i -= 1) {
    const found = findLastTextNode(node.childNodes[i]!);
    if (found) return found;
  }
  return null;
}

function trimParentTrailingForFragmentJoin(parent: HTMLElement): void {
  const lastText = findLastTextNode(parent);
  if (!lastText) return;
  let value = lastText.textContent ?? '';
  value = value.replace(/\s+$/u, '');
  if (value.endsWith('-')) value = value.slice(0, -1);
  if (!value) {
    lastText.parentNode?.removeChild(lastText);
    trimParentTrailingForFragmentJoin(parent);
    return;
  }
  lastText.textContent = value;
}

function appendMergedTextFragments(
  parent: HTMLElement,
  fragments: Element[],
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): void {
  for (let i = 0; i < fragments.length; i += 1) {
    if (i > 0) trimParentTrailingForFragmentJoin(parent);
    appendRenderedBody(parent, fragments[i]!, elementIds, {
      inline: true,
      trimLeading: i > 0,
    }, assetUrls);
  }
}

function renderMergedIntraPageFragments(
  fragments: Element[],
  elementIds: Map<Element, string>,
  assetUrls: Map<string, string> | undefined
): HTMLElement {
  const first = fragments[0]!;
  const tag = localName(first);
  const firstId = elementIds.get(first);
  const threadId = elementThreadId(first);

  let node: HTMLElement;
  if (tag === 'text') {
    node = document.createElement('p');
    appendMergedTextFragments(node, fragments, elementIds, assetUrls);
  } else if (tag === 'list') {
    const listClass = first.getAttribute('class') ?? 'unordered';
    node = document.createElement(listClass === 'ordered' ? 'ol' : 'ul');
    for (const el of fragments) {
      appendListItemsFromElement(node, el, elementIds, assetUrls);
    }
  } else {
    node = document.createElement('div');
    node.className = 'rendered-fragment-merged-body';
    for (const el of fragments) {
      appendRenderedBodyBlocks(node, el, elementIds, assetUrls);
    }
  }

  const wrap = wrapRendered(first, node, firstId, 'rendered-fragment-merged');
  if (threadId) wrap.setAttribute('data-thread-id', threadId);
  return wrap;
}

function collectIntraPageThreads(segment: Element[]): Map<string, Element[]> {
  const byThread = new Map<string, Element[]>();
  for (const el of segment) {
    if (el.nodeType !== Node.ELEMENT_NODE) continue;
    if (localName(el) === 'page_break') continue;
    const tid = elementThreadId(el);
    if (!tid) continue;
    if (!byThread.has(tid)) byThread.set(tid, []);
    byThread.get(tid)!.push(el);
  }
  for (const [tid, members] of byThread) {
    if (members.length < 2) byThread.delete(tid);
  }
  return byThread;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@customElement('doclang-reading-pane')
export class DoclangReadingPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  @state() private _showFurniture = true;
  @state() private _showBackground = true;
  @state() private _settingsOpen = false;
  @state() private _visible = false;
  // null = no document loaded yet; false = document loaded but no markup; true = has markup
  @state() private _hasMarkup: boolean | null = null;
  private _pendingContent: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-reading');
  }

  override render() {
    const bodyClasses = {
      'pane-body': true,
      'show-reading-furniture': this._showFurniture,
      'show-reading-background': this._showBackground,
    };

    return html`
      <div class="pane-header">
        <span class="pane-header-title">Reading view</span>
        ${this._visible
          ? html`<button
              type="button"
              class="pane-settings-toggle"
              aria-expanded=${this._settingsOpen ? 'true' : 'false'}
              aria-controls="reading-settings"
              @click=${this._onSettingsToggle}
            >
              Layers
            </button>`
          : nothing}
      </div>
      <div class="pane-reading-layout">
        <div id="rendered-pane" class=${classMap(bodyClasses)} @click=${this._onBodyClick}>
          ${this._hasMarkup === false
            ? html`<div class="placeholder">${NO_MARKUP}</div>`
            : this._hasMarkup === true
              ? html`<div ${ref(this._onContentRef)}></div>`
              : nothing}
        </div>
        ${this._settingsOpen ? this._renderSettings() : nothing}
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

  private _renderSettings() {
    return html`
      <div class="viewer-settings-layer">
        <button
          type="button"
          class="viewer-settings-scrim"
          tabindex="-1"
          aria-label="Close layers"
          @click=${this._onSettingsClose}
        ></button>
        <aside
          class="viewer-settings"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reading-settings-title"
        >
          <div class="viewer-settings-header">
            <h2 class="viewer-settings-title" id="reading-settings-title">Layers</h2>
            <button
              type="button"
              class="viewer-settings-close"
              aria-label="Close layers"
              @click=${this._onSettingsClose}
            >
              ×
            </button>
          </div>
          <div class="viewer-settings-body">
            <div
              class="settings-subgroup"
              role="group"
              aria-labelledby="reading-settings-title"
            >
              <label class="settings-option settings-option-sub">
                <input
                  type="checkbox"
                  class="cb-furniture"
                  .checked=${this._showFurniture}
                  @change=${this._onFurnitureChange}
                />
                <span>Furniture</span>
              </label>
              <label class="settings-option settings-option-sub">
                <input
                  type="checkbox"
                  class="cb-background"
                  .checked=${this._showBackground}
                  @change=${this._onBackgroundChange}
                />
                <span>Background</span>
              </label>
            </div>
          </div>
        </aside>
      </div>
    `;
  }

  /** The scrollable content body inside the shadow root. */
  get scrollPane(): HTMLElement | null {
    return this.shadowRoot?.querySelector('.pane-body') ?? null;
  }

  setVisible(visible: boolean): void {
    this._visible = visible;
    this.hidden = !visible;
    this.requestUpdate();
  }

  setSettingsOpen(open: boolean): void {
    this._settingsOpen = open;
    this.requestUpdate();
  }

  protected override _applySelection(): void {
    if (!this.shadowRoot) return;
    for (const el of this.shadowRoot.querySelectorAll('.rendered-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this._selectedId) return;
    const renderedEl = this._findRenderedElement(this._selectedId, this._peerIds);
    if (!renderedEl) return;
    this._revealContext(renderedEl);
    renderedEl.classList.add('selected');
    renderedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ---------------------------------------------------------------------------
  // Document rendering
  // ---------------------------------------------------------------------------

  protected override _renderDocument(): void {
    const state = this._docState;
    if (!state) {
      this._pendingContent = null;
      this._hasMarkup = null;
      return;
    }

    const segment = state.segments[this._currentPage - 1] ?? [];
    // elementIds may already have been assigned by markup-pane; re-use if available
    const elementIds = state.elementIds.size
      ? state.elementIds
      : assignElementIds(segment);
    state.elementIds = elementIds;

    if (segmentHasMarkup(segment)) {
      this._pendingContent = this._buildRenderedArticle(segment, elementIds);
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

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _onSettingsToggle = (): void => {
    this.dispatchEvent(
      new CustomEvent('doclang-reading-settings-toggle', { bubbles: true, composed: true })
    );
  };

  private _onSettingsClose = (): void => {
    this.dispatchEvent(
      new CustomEvent('doclang-reading-settings-close', { bubbles: true, composed: true })
    );
  };

  private _onFurnitureChange = (e: Event): void => {
    this._showFurniture = (e.target as HTMLInputElement).checked;
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent('doclang-show-reading-furniture', {
        bubbles: true,
        composed: true,
        detail: { checked: this._showFurniture },
      })
    );
  };

  private _onBackgroundChange = (e: Event): void => {
    this._showBackground = (e.target as HTMLInputElement).checked;
    this.requestUpdate();
    this.dispatchEvent(
      new CustomEvent('doclang-show-reading-background', {
        bubbles: true,
        composed: true,
        detail: { checked: this._showBackground },
      })
    );
  };

  private _onBodyClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    const ghostText = target.closest('.rendered-el-virtual-text');
    const elementId = ghostText?.hasAttribute('data-element-id')
      ? ghostText.getAttribute('data-element-id')!
      : (target
          .closest('.rendered-el[data-element-id]')
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

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _buildRenderedArticle(
    segment: Element[],
    elementIds: Map<Element, string>
  ): HTMLElement {
    const assetUrls = this._docState?.assetUrls;
    const intraPageThreads = collectIntraPageThreads(segment);
    const skipElements = new Set<Element>();
    const mergeGroups = new Map<Element, Element[]>();

    for (const [, members] of intraPageThreads) {
      mergeGroups.set(members[0]!, members);
      for (let i = 1; i < members.length; i += 1) {
        skipElements.add(members[i]!);
      }
    }

    const article = document.createElement('article');
    article.className = 'rendered-doc';
    for (const el of segment) {
      if (el.nodeType !== Node.ELEMENT_NODE) continue;
      if (localName(el) === 'page_break') continue;
      if (skipElements.has(el)) continue;

      const mergeGroup = mergeGroups.get(el);
      const rendered = mergeGroup
        ? renderMergedIntraPageFragments(mergeGroup, elementIds, assetUrls)
        : renderBlockElement(el, elementIds, { inline: false }, assetUrls);
      if (rendered) article.appendChild(rendered);
    }
    return article;
  }

  private _findRenderedElement(
    elementId: string,
    peerIds: Set<string>
  ): Element | null {
    if (!this.shadowRoot) return null;
    const direct =
      this.shadowRoot.querySelector(
        `.rendered-el-virtual-text[data-element-id="${elementId}"]`
      ) ??
      this.shadowRoot.querySelector(`.rendered-el[data-element-id="${elementId}"]`);
    if (direct) return direct;

    const xmlEl = this._docState?.idToElement?.get(elementId);
    const threadId = xmlEl ? elementThreadId(xmlEl) : null;
    if (!threadId) return null;
    const merged = this.shadowRoot.querySelector(
      `.rendered-fragment-merged[data-thread-id="${threadId}"]`
    );
    if (!merged) return null;
    const primaryId = merged.getAttribute('data-element-id');
    if (!primaryId || primaryId === elementId) return merged;
    return peerIds.has(elementId) ? merged : null;
  }

  private _revealContext(renderedEl: Element): void {
    const pictureContents = renderedEl.closest(
      '.rendered-picture-contents'
    ) as HTMLDetailsElement | null;
    if (pictureContents && !pictureContents.open) pictureContents.open = true;
    this._revealLayer(renderedEl);
  }

  private _revealLayer(renderedEl: Element): void {
    const layer = renderedEl.getAttribute('data-doclang-layer');
    if (!layer || layer === 'body') return;
    if (layer === 'furniture' && !this._showFurniture) {
      this._showFurniture = true;
      this.requestUpdate();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-furniture', {
          bubbles: true,
          composed: true,
          detail: { checked: true },
        })
      );
    } else if (layer === 'background' && !this._showBackground) {
      this._showBackground = true;
      this.requestUpdate();
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-background', {
          bubbles: true,
          composed: true,
          detail: { checked: true },
        })
      );
    }
  }
}
