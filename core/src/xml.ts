import {
  DOCLANG_NS,
  HEAD_TAGS,
  CELL_TOKENS,
  CELL_CONTENT_TAGS,
  CELL_SPAN_TAGS,
  OTSL_CONTAINER_TAGS,
  SEMANTIC_TAGS,
} from './constants';
import type { ParsedElementHead } from './types';

export function isTextLikeNode(node: Node): boolean {
  return (
    node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE
  );
}

export function isWhitespaceOnlyText(node: Node): boolean {
  return isTextLikeNode(node) && !node.textContent?.trim();
}

export function markupAttributes(el: Element): { name: string; value: string }[] {
  return [...el.attributes]
    .filter(a => a.name !== 'xmlns' || a.value !== DOCLANG_NS)
    .map(a => ({ name: a.name, value: a.value }));
}

export function childElements(el: Element): Element[] {
  return [...el.children];
}

export function localName(el: Element): string {
  return el.localName || el.tagName.replace(/^.*:/, '');
}

export function headLocations(el: Element): Element[] {
  return parseElementHeadAt([...el.childNodes], 0)?.locs ?? [];
}

export function parseElementHeadAt(
  nodes: ArrayLike<ChildNode>,
  startIdx: number
): ParsedElementHead | null {
  const locs: Element[] = [];
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (!node) {
      i += 1;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (tag === 'location') {
      locs.push(node as Element);
      i += 1;
      if (locs.length === 4) return { locs, nextIndex: i };
      continue;
    }
    if (locs.length) break;
    if (HEAD_TAGS.has(tag)) {
      i += 1;
      continue;
    }
    break;
  }
  return locs.length === 4 ? { locs, nextIndex: i } : null;
}

export function walkElements(
  nodes: ArrayLike<ChildNode> | Element[],
  fn: (el: Element) => void
): void {
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node || node.nodeType !== Node.ELEMENT_NODE) continue;
    fn(node as Element);
    walkElements(childElements(node as Element), fn);
  }
}

export function isCellToken(tag: string): boolean {
  return CELL_TOKENS.has(tag);
}

export function isListOrOtslContainer(el: Element): boolean {
  const tag = localName(el);
  return tag === 'list' || OTSL_CONTAINER_TAGS.has(tag);
}

export function skipContainerLevelHead(nodes: ChildNode[], startIdx: number): number {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (!node) {
      i += 1;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (tag === 'ldiv' || isCellToken(tag)) break;
    if (HEAD_TAGS.has(tag) || tag === 'location') {
      i += 1;
      continue;
    }
    break;
  }
  return i;
}

export function skipUntilListItemBoundary(nodes: ChildNode[], startIdx: number): number {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      localName(node as Element) === 'ldiv'
    )
      break;
    i += 1;
  }
  return i;
}

export function skipUntilCellBoundary(nodes: ChildNode[], startIdx: number): number {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      isCellToken(localName(node as Element))
    )
      break;
    i += 1;
  }
  return i;
}

export function locationResolution(el: Element, axisDefault: number): number {
  const r = parseInt(el.getAttribute('resolution') ?? String(axisDefault), 10);
  return Number.isFinite(r) && r > 0 ? r : axisDefault;
}

export function headingLevel(el: Element): number {
  return Math.min(
    Math.max(parseInt(el.getAttribute('level') ?? '1', 10) || 1, 1),
    6
  );
}

export function firstHeadChild(el: Element, tag: string): Element | null {
  return childElements(el).find(child => localName(child) === tag) ?? null;
}

export function xmlContains(target: Node, ancestor: Node): boolean {
  let node: Node | null = target;
  while (node) {
    if (node === ancestor) return true;
    node = node.parentNode;
  }
  return false;
}

export function formatMarkupTextNode(node: Node): string {
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `<![CDATA[${node.textContent ?? ''}]]>`;
  }
  return node.textContent?.trim() ?? '';
}

export function serializeMarkupTextNodes(nodes: ArrayLike<ChildNode>): string {
  return Array.from(nodes)
    .filter(n => isTextLikeNode(n) && !isWhitespaceOnlyText(n))
    .map(formatMarkupTextNode)
    .join('');
}

export function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function normalizeArchivePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

export function archiveRelativeAssetPath(path: string): string | null {
  const norm = normalizeArchivePath(path);
  const idx = norm.indexOf('assets/');
  return idx === -1 ? null : norm.slice(idx);
}

export function mimeFromAssetPath(path: string): string {
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

export function skipOtslContainerHead(nodes: ChildNode[], startIdx: number): number {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (!node) {
      i += 1;
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (isCellToken(tag)) break;
    if (HEAD_TAGS.has(tag) || tag === 'h_thread' || tag === 'location') {
      i += 1;
      continue;
    }
    break;
  }
  return i;
}

export function skipElementHeadNodes(nodes: ChildNode[], startIdx: number): number {
  let i = startIdx;
  while (i < nodes.length && isWhitespaceOnlyText(nodes[i]!)) i += 1;
  while (i < nodes.length) {
    const node = nodes[i];
    if (
      node &&
      node.nodeType === Node.ELEMENT_NODE &&
      HEAD_TAGS.has(localName(node as Element))
    ) {
      i += 1;
      while (i < nodes.length && isWhitespaceOnlyText(nodes[i]!)) i += 1;
      continue;
    }
    break;
  }
  return i;
}

export function isSemanticElement(el: Element): boolean {
  return SEMANTIC_TAGS.has(localName(el));
}

export function isVirtualTextHost(el: Element): boolean {
  const tag = localName(el);
  return tag === 'ldiv' || CELL_CONTENT_TAGS.has(tag);
}

export function elementThreadId(el: Element): string | null {
  return firstHeadChild(el, 'thread')?.getAttribute('thread_id') ?? null;
}

export function elementLayer(el: Element): string {
  const layerEl = firstHeadChild(el, 'layer');
  if (layerEl) {
    const value = layerEl.getAttribute('value') ?? 'body';
    return ELEMENT_LAYERS.has(value) ? value : 'body';
  }
  if (headLocations(el).length === 4) return 'body';
  const parent = el.parentElement;
  if (!parent) return 'body';
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return 'body';
  return layerFromHeadNodes(nodes, idx + 1);
}

export const ELEMENT_LAYERS = new Set(['body', 'background', 'furniture']);

export function layerFromHeadNodes(nodes: ChildNode[], startIdx: number): string {
  let i = startIdx;
  while (i < nodes.length) {
    const node = nodes[i];
    if (!node) { i += 1; continue; }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (tag === 'layer') {
      const value = (node as Element).getAttribute('value') ?? 'body';
      return ELEMENT_LAYERS.has(value) ? value : 'body';
    }
    if (tag === 'location') break;
    if (HEAD_TAGS.has(tag)) {
      i += 1;
      continue;
    }
    break;
  }
  return 'body';
}

export function layerClassForValue(layer: string): string {
  if (layer === 'furniture') return 'layer-furniture';
  if (layer === 'background') return 'layer-background';
  return '';
}

export function headingLevelFromEl(el: Element): number {
  return headingLevel(el);
}

export function elementLabel(el: Element): string {
  if (isVirtualTextOverlayUnit(el)) return 'text';
  const tag = localName(el);
  if (tag === 'heading' || tag === 'field_heading') return `${tag}[${headingLevel(el)}]`;
  const level = el.getAttribute('level');
  if (level) return `${tag}[${level}]`;
  const cls = el.getAttribute('class');
  if (cls) return `${tag}.${cls}`;
  return tag;
}

export function isVirtualTextOverlayUnit(el: Element): boolean {
  if (headLocations(el).length === 4) return false;
  if (!hasVirtualTextLocations(el)) return false;
  const tag = localName(el);
  if (tag === 'ldiv' && el.parentElement && localName(el.parentElement) === 'list') return true;
  if (isCellToken(tag) && tag !== 'nl' && !CELL_SPAN_TAGS.has(tag)) {
    return el.parentElement ? OTSL_CONTAINER_TAGS.has(localName(el.parentElement)) : false;
  }
  return false;
}

export function hasVirtualTextLocations(el: Element): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return false;
  return parseElementHeadAt(nodes, idx + 1) !== null;
}

export function virtualTextHeadLocations(el: Element): Element[] {
  const parent = el.parentElement;
  if (!parent) return [];
  const nodes = [...parent.childNodes];
  const idx = nodes.indexOf(el);
  if (idx < 0) return [];
  return parseElementHeadAt(nodes, idx + 1)?.locs ?? [];
}

export function elementHeadLocations(el: Element): Element[] {
  const own = headLocations(el);
  return own.length === 4 ? own : virtualTextHeadLocations(el);
}
