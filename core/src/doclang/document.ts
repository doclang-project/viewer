import {
  DOCLANG_NS,
  HEAD_TAGS,
  CELL_SPAN_TAGS,
  OTSL_CONTAINER_TAGS,
  childElements,
  localName,
  headLocations,
  firstHeadChild,
  walkElements,
  locationResolution,
  parseElementHeadAt,
  skipContainerLevelHead,
  skipUntilListItemBoundary,
  skipUntilCellBoundary,
  isCellToken,
  isTextLikeNode,
  isWhitespaceOnlyText,
  serializeMarkupTextNodes,
  formatMarkupTextNode,
  archiveRelativeAssetPath,
  elementLayer,
  elementLabel,
  isVirtualTextOverlayUnit,
} from './dom';
import type {
  DocumentState,
  Resolution,
  BoundingBox,
  ReadingOrderStep,
  CaptionLink,
  XrefLink,
  FragmentLink,
  FragmentNavItem,
  ThreadNav,
} from './types';
import { extractArchiveFromZipBuffer } from './zip';
import { isPictureContentElement, isTableContentElement } from './dom';

export const PAGE_IMAGE_RE = /^(\d+)\.(png|jpe?g|webp)$/i;
export const NO_MARKUP = '(No markup to be shown.)';
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

// ---------------------------------------------------------------------------
// Document XML parsing helpers
// ---------------------------------------------------------------------------

export function splitIntoSegments(root: Element): Element[][] {
  const body = childElements(root).filter(el => localName(el) !== 'head');
  const segments: Element[][] = [[]];
  for (const el of body) {
    if (localName(el) === 'page_break') {
      segments.push([]);
    } else {
      segments[segments.length - 1]!.push(el);
    }
  }
  return segments.length ? segments : [[]];
}

export function segmentHasMarkup(segment: Element[]): boolean {
  return segment.some(el => el.nodeType === Node.ELEMENT_NODE);
}

export function readDefaultResolution(head: Element | null): Resolution {
  const fallback = { width: 512, height: 512 };
  if (!head) return fallback;
  const dr = childElements(head).find(el => localName(el) === 'default_resolution');
  if (!dr) return fallback;
  const w = parseInt(dr.getAttribute('width') ?? '512', 10);
  const h = parseInt(dr.getAttribute('height') ?? '512', 10);
  return {
    width: Number.isFinite(w) && w > 0 ? w : 512,
    height: Number.isFinite(h) && h > 0 ? h : 512,
  };
}

export function assignElementIds(segment: Element[]): Map<Element, string> {
  const ids = new Map<Element, string>();
  let counter = 0;
  walkElements(segment, el => {
    ids.set(el, `el-${counter++}`);
  });
  return ids;
}

export function invertElementIds(
  elementIds: Map<Element, string>
): Map<string, Element> {
  const idToElement = new Map<string, Element>();
  for (const [el, id] of elementIds) idToElement.set(id, el);
  return idToElement;
}

// ---------------------------------------------------------------------------
// Thread / reading order helpers
// ---------------------------------------------------------------------------

function buildThreadsById(docRoot: Element): Map<string, Element[]> {
  const map = new Map<string, Element[]>();
  const roots = childElements(docRoot).filter(el => localName(el) !== 'head');
  walkElements(roots, el => {
    for (const child of childElements(el)) {
      if (localName(child) !== 'thread') continue;
      const threadId = child.getAttribute('thread_id');
      if (!threadId) continue;
      if (!map.has(threadId)) map.set(threadId, []);
      map.get(threadId)!.push(el);
    }
  });
  return map;
}

export function buildElementPageMap(segments: Element[][]): Map<Element, number> {
  const elementPage = new Map<Element, number>();
  segments.forEach((segment, idx) => {
    const pageNum = idx + 1;
    walkElements(segment, el => elementPage.set(el, pageNum));
  });
  return elementPage;
}

export function buildThreadPagesById(
  docRoot: Element,
  elementPageByEl: Map<Element, number>
): Map<string, Set<number>> {
  const threadPagesById = new Map<string, Set<number>>();
  for (const [threadId, elements] of buildThreadsById(docRoot)) {
    const pages = new Set<number>();
    for (const el of elements) {
      const page = elementPageByEl.get(el);
      if (page) pages.add(page);
    }
    if (pages.size) threadPagesById.set(threadId, pages);
  }
  return threadPagesById;
}

export function buildThreadNavByElement(docRoot: Element): Map<Element, ThreadNav> {
  const nav = new Map<Element, ThreadNav>();
  for (const [, elements] of buildThreadsById(docRoot)) {
    for (let i = 0; i < elements.length; i += 1) {
      nav.set(elements[i]!, {
        prev: i > 0 ? elements[i - 1]! : null,
        next: i < elements.length - 1 ? elements[i + 1]! : null,
      });
    }
  }
  return nav;
}

function isReadingOrderUnit(el: Element): boolean {
  const tag = localName(el);
  if (tag === 'caption') return true;
  if (
    HEAD_TAGS.has(tag) ||
    tag === 'location' ||
    tag === 'h_thread' ||
    tag === 'page_break'
  )
    return false;
  if (tag === 'nl' || CELL_SPAN_TAGS.has(tag)) return false;
  if (RENDER_FORMAT_TAGS.has(tag) || tag === 'src' || tag === 'checkbox') return false;
  return true;
}

export function computeReadingOrder(docRoot: Element): Element[] {
  const bodyChildren = childElements(docRoot).filter(el => localName(el) !== 'head');
  const threadsById = buildThreadsById(docRoot);
  const consumedViaXref = new Set<Element>();
  const order: Element[] = [];

  function record(el: Element): void {
    if (!isReadingOrderUnit(el)) return;
    order.push(el);
  }

  function consumeThread(threadId: string): void {
    for (const target of threadsById.get(threadId) ?? []) {
      if (consumedViaXref.has(target)) continue;
      consumedViaXref.add(target);
      visitElement(target);
    }
  }

  function walkChildren(parent: Element): void {
    for (const child of parent.childNodes) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const el = child as Element;
      const tag = localName(el);
      if (tag === 'xref') {
        const threadId = el.getAttribute('thread_id');
        if (threadId) consumeThread(threadId);
        continue;
      }
      if (tag === 'page_break') continue;
      visitElement(el);
    }
  }

  function visitElement(el: Element): void {
    record(el);
    walkChildren(el);
  }

  for (const el of bodyChildren) {
    if (localName(el) === 'page_break') continue;
    if (consumedViaXref.has(el)) continue;
    visitElement(el);
  }

  return order;
}

function isReadingOrderOverlayUnit(el: Element): boolean {
  if (!isReadingOrderUnit(el)) return false;
  if (isPictureContentElement(el) || isTableContentElement(el)) return false;
  if (headLocations(el).length === 4) return true;
  return isVirtualTextOverlayUnit(el);
}

export function computeReadingOrderDisplayNumbers(
  readingOrder: Element[]
): Map<Element, number> {
  const numbers = new Map<Element, number>();
  let n = 0;
  for (const el of readingOrder) {
    if (!isReadingOrderOverlayUnit(el)) continue;
    n += 1;
    numbers.set(el, n);
  }
  return numbers;
}

// ---------------------------------------------------------------------------
// Bounding box collection
// ---------------------------------------------------------------------------

function pushBoundingBox(
  boxes: BoundingBox[],
  locs: Element[],
  defaultResolution: Resolution,
  kind: string,
  tag: string,
  elementId: string,
  layer = 'body'
): void {
  const [x0el, y0el, x1el, y1el] = locs as [Element, Element, Element, Element];
  const resW = locationResolution(x0el, defaultResolution.width);
  const resH = locationResolution(y0el, defaultResolution.height);
  boxes.push({
    kind,
    tag,
    elementId,
    layer,
    x0: parseInt(x0el.getAttribute('value') ?? '0', 10),
    y0: parseInt(y0el.getAttribute('value') ?? '0', 10),
    x1: parseInt(x1el.getAttribute('value') ?? '0', 10),
    y1: parseInt(y1el.getAttribute('value') ?? '0', 10),
    resW,
    resH,
  });
}

function collectListVirtualTextBoxes(
  list: Element,
  defaultResolution: Resolution,
  boxes: BoundingBox[],
  elementIds: Map<Element, string>
): void {
  const nodes = [...list.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE || localName(node as Element) !== 'ldiv') {
      i += 1;
      continue;
    }
    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) {
      const elementId = elementIds.get(node as Element);
      if (elementId) {
        pushBoundingBox(
          boxes,
          head.locs,
          defaultResolution,
          'text',
          'text',
          elementId,
          elementLayer(node as Element)
        );
      }
      i = head.nextIndex;
    }
    i = skipUntilListItemBoundary(nodes, i);
  }
}

function collectTableVirtualTextBoxes(
  container: Element,
  defaultResolution: Resolution,
  boxes: BoundingBox[],
  elementIds: Map<Element, string>
): void {
  const nodes = [...container.childNodes];
  let i = skipContainerLevelHead(nodes, 0);
  while (i < nodes.length) {
    const node = nodes[i]!;
    if (node.nodeType !== Node.ELEMENT_NODE) {
      i += 1;
      continue;
    }
    const tag = localName(node as Element);
    if (!isCellToken(tag)) {
      i += 1;
      continue;
    }
    if (tag === 'nl') {
      i += 1;
      continue;
    }
    i += 1;
    const head = parseElementHeadAt(nodes, i);
    if (head) {
      const elementId = elementIds.get(node as Element);
      if (elementId) {
        pushBoundingBox(
          boxes,
          head.locs,
          defaultResolution,
          'text',
          'text',
          elementId,
          elementLayer(node as Element)
        );
      }
      i = head.nextIndex;
    }
    i = skipUntilCellBoundary(nodes, i);
  }
}

export function collectBoundingBoxes(
  segment: Element[],
  defaultResolution: Resolution,
  elementIds: Map<Element, string>
): BoundingBox[] {
  const boxes: BoundingBox[] = [];
  walkElements(segment, el => {
    const locs = headLocations(el);
    if (locs.length !== 4) return;
    const elementId = elementIds.get(el);
    if (!elementId) return;
    pushBoundingBox(
      boxes,
      locs,
      defaultResolution,
      localName(el),
      elementLabel(el),
      elementId,
      elementLayer(el)
    );
  });
  walkElements(segment, el => {
    const tag = localName(el);
    if (tag === 'list')
      collectListVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
    else if (OTSL_CONTAINER_TAGS.has(tag)) {
      collectTableVirtualTextBoxes(el, defaultResolution, boxes, elementIds);
    }
  });
  return boxes;
}

export function collectCaptionLinks(
  segment: Element[],
  elementIds: Map<Element, string>,
  boxes: BoundingBox[]
): CaptionLink[] {
  const boxById = new Map(boxes.map(b => [b.elementId, b]));
  const links: CaptionLink[] = [];
  walkElements(segment, el => {
    if (localName(el) !== 'caption') return;
    const captionId = elementIds.get(el);
    const captionBox = captionId ? boxById.get(captionId) : null;
    if (!captionBox) return;
    const host = el.parentElement;
    if (!host || headLocations(host).length !== 4) return;
    const hostId = elementIds.get(host);
    const hostBox = hostId ? boxById.get(hostId) : null;
    if (!hostBox) return;
    links.push({
      captionBox,
      hostBox,
      captionElementId: captionId!,
      hostElementId: hostId!,
    });
  });
  return links;
}

export function collectXrefLinks(
  segment: Element[],
  elementIds: Map<Element, string>,
  boxes: BoundingBox[]
): XrefLink[] {
  const boxById = new Map(boxes.map(b => [b.elementId, b]));
  const threadsById = new Map<string, { elementId: string; box: BoundingBox }[]>();

  walkElements(segment, el => {
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    for (const thread of childElements(el)) {
      if (localName(thread) !== 'thread') continue;
      const threadId = thread.getAttribute('thread_id');
      if (!threadId) continue;
      if (!threadsById.has(threadId)) threadsById.set(threadId, []);
      threadsById.get(threadId)!.push({ elementId: elementId!, box });
    }
  });

  const links: XrefLink[] = [];
  walkElements(segment, el => {
    const xrefs = childElements(el).filter(c => localName(c) === 'xref');
    if (!xrefs.length) return;
    const from = findNearestLocatedBox(el, elementIds, boxById);
    if (!from) return;
    for (const xref of xrefs) {
      const threadId = xref.getAttribute('thread_id');
      if (!threadId) continue;
      for (const { elementId: toId, box: toBox } of threadsById.get(threadId) ?? []) {
        if (toId === from.elementId) continue;
        links.push({
          fromBox: from.box,
          toBox,
          fromElementId: from.elementId,
          toElementId: toId,
        });
      }
    }
  });
  return links;
}

function findNearestLocatedBox(
  el: Element,
  elementIds: Map<Element, string>,
  boxById: Map<string, BoundingBox>
): { elementId: string; box: BoundingBox } | null {
  let node: Element | null = el;
  while (node) {
    const elementId = elementIds.get(node);
    const box = elementId ? boxById.get(elementId) : null;
    if (box) return { elementId: elementId!, box };
    if (localName(node) === 'doclang') break;
    node = node.parentElement;
  }
  return null;
}

export function collectFragmentLinks(
  segment: Element[],
  elementIds: Map<Element, string>,
  boxes: BoundingBox[],
  pageNum: number,
  threadPagesById: Map<string, Set<number>>
): FragmentLink[] {
  const boxById = new Map(boxes.map(b => [b.elementId, b]));
  const onPage = new Map<string, { elementId: string; box: BoundingBox }[]>();

  walkElements(segment, el => {
    const thread = firstHeadChild(el, 'thread');
    const threadId = thread?.getAttribute('thread_id');
    if (!threadId) return;
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    if (!onPage.has(threadId)) onPage.set(threadId, []);
    onPage.get(threadId)!.push({ elementId: elementId!, box });
  });

  const links: FragmentLink[] = [];

  for (const [threadId, members] of onPage) {
    if (members.length >= 2) {
      for (let i = 0; i < members.length - 1; i += 1) {
        links.push({
          fromBox: members[i]!.box,
          toBox: members[i + 1]!.box,
          fromElementId: members[i]!.elementId,
          toElementId: members[i + 1]!.elementId,
          threadId,
        });
      }
      continue;
    }

    if (members.length !== 1) continue;
    const threadPages = threadPagesById.get(threadId);
    if (!threadPages) continue;
    const hasPrevious = [...threadPages].some(p => p < pageNum);
    const hasFollowing = [...threadPages].some(p => p > pageNum);
    if (!hasPrevious && !hasFollowing) continue;

    const base = {
      fromBox: members[0]!.box,
      toBox: null,
      fromElementId: members[0]!.elementId,
      toElementId: null,
      threadId,
    };
    if (hasPrevious) links.push({ ...base, targetCorner: 'tl' as const });
    if (hasFollowing) links.push({ ...base, targetCorner: 'br' as const });
  }

  return links;
}

export function collectFragmentNavItems(
  segment: Element[],
  elementIds: Map<Element, string>,
  boxes: BoundingBox[],
  threadNavByElement: Map<Element, ThreadNav>
): FragmentNavItem[] {
  const boxById = new Map(boxes.map(b => [b.elementId, b]));
  const items: FragmentNavItem[] = [];
  walkElements(segment, el => {
    const nav = threadNavByElement.get(el);
    if (!nav || (!nav.prev && !nav.next)) return;
    const elementId = elementIds.get(el);
    const box = elementId ? boxById.get(elementId) : null;
    if (!box) return;
    items.push({
      elementId: elementId!,
      box,
      hasPrev: nav.prev !== null,
      hasNext: nav.next !== null,
    });
  });
  return items;
}

export function collectReadingOrderSteps(
  segment: Element[],
  elementIds: Map<Element, string>,
  boxes: BoundingBox[],
  readingOrder: Element[],
  globalNumbering = true,
  displayNumbers: Map<Element, number> | null = null
): ReadingOrderStep[] {
  const boxById = new Map(boxes.map(b => [b.elementId, b]));
  const steps: ReadingOrderStep[] = [];
  let pageOrder = 0;

  readingOrder.forEach(el => {
    if (isPictureContentElement(el) || isTableContentElement(el)) return;
    const elementId = elementIds.get(el);
    if (!elementId) return;
    const box = boxById.get(elementId);
    if (!box) return;
    pageOrder += 1;
    steps.push({
      order: globalNumbering ? (displayNumbers?.get(el) ?? pageOrder) : pageOrder,
      box,
      elementId,
    });
  });

  return steps;
}

// ---------------------------------------------------------------------------
// Build document state
// ---------------------------------------------------------------------------

export function buildDocumentState(
  markupXml: string,
  pageImages: Map<number, string>,
  label: string,
  assetUrls: Map<string, string>,
  { markupOnly }: { markupOnly: boolean }
): DocumentState | null {
  const doc = new DOMParser().parseFromString(markupXml, 'application/xml');
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    alert(`Invalid XML in ${label}`);
    return null;
  }
  const root = doc.documentElement;
  if (localName(root) !== 'doclang') {
    alert(`${label}: root element must be <doclang>`);
    return null;
  }

  const head = childElements(root).find(el => localName(el) === 'head') ?? null;
  const defaultResolution = readDefaultResolution(head);
  const segments = markupOnly
    ? [childElements(root).filter(el => localName(el) !== 'head')]
    : splitIntoSegments(root);
  const hasPageView = !markupOnly && pageImages.size > 0;
  const maxImagePage = hasPageView ? Math.max(...pageImages.keys()) : 0;
  const pageCount = markupOnly ? 1 : Math.max(segments.length, maxImagePage, 1);
  const readingOrder = computeReadingOrder(root);
  const elementPageByEl = buildElementPageMap(segments);

  return {
    pageImages,
    assetUrls,
    currentPage: 1,
    pageCount,
    segments,
    defaultResolution,
    elementIds: new Map(),
    idToElement: new Map(),
    hasPageView,
    markupOnly,
    docRoot: root,
    threadPagesById: buildThreadPagesById(root, elementPageByEl),
    elementPageByEl,
    threadNavByElement: buildThreadNavByElement(root),
    pendingSelectElement: null,
    readingOrder,
    readingOrderDisplayNumbers: computeReadingOrderDisplayNumbers(readingOrder),
    pageViewOverlay: null,
  };
}

// ---------------------------------------------------------------------------
// Archive extraction helpers
// ---------------------------------------------------------------------------

export async function extractArchiveFromFiles(files: File[]): Promise<{
  markupXml: string;
  pageImages: Map<number, string>;
  assetUrls: Map<string, string>;
}> {
  const markupFile = files.find(f => f.name === 'document.xml');
  if (!markupFile) throw new Error('Archive must contain document.xml at its root.');
  const markupXml = await markupFile.text();
  const pageImages = new Map<number, string>();
  const assetUrls = new Map<string, string>();
  for (const f of files) {
    const relPath = f.webkitRelativePath || f.name;
    const parts = relPath.split('/');
    if (parts.length >= 2 && parts[parts.length - 2] === 'pages') {
      const m = PAGE_IMAGE_RE.exec(f.name);
      if (m) pageImages.set(Number(m[1]), URL.createObjectURL(f));
    }
    const assetPath = archiveRelativeAssetPath(relPath);
    if (assetPath) assetUrls.set(assetPath, URL.createObjectURL(f));
  }
  return { markupXml, pageImages, assetUrls };
}

export { extractArchiveFromZipBuffer };

export function revokeDocumentState(docState: DocumentState): void {
  if (!docState) return;
  for (const url of docState.pageImages.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  for (const url of docState.assetUrls.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
}

export function serializeSegment(segment: Element[]): string {
  return segment.map(el => serializeElement(el, 0)).join('\n');
}

function serializeElement(el: Element, depth: number): string {
  const pad = '  '.repeat(depth);
  const tag = localName(el);
  const attrs = [...el.attributes]
    .filter(a => a.name !== 'xmlns' || a.value !== DOCLANG_NS)
    .map(a => `${a.name}="${a.value}"`)
    .join(' ');
  const attrStr = attrs ? ` ${attrs}` : '';

  if (!el.childNodes.length) return `${pad}<${tag}${attrStr}/>`;

  const meaningfulText = [...el.childNodes].filter(
    n => isTextLikeNode(n) && !isWhitespaceOnlyText(n)
  );
  const textOnly =
    meaningfulText.length > 0 &&
    meaningfulText.every(isTextLikeNode) &&
    !childElements(el).length;
  if (textOnly) {
    const text = serializeMarkupTextNodes(el.childNodes);
    if (text) return `${pad}<${tag}${attrStr}>${text}</${tag}>`;
  }

  const parts = [`${pad}<${tag}${attrStr}>`];
  for (const child of el.childNodes) {
    if (isTextLikeNode(child)) {
      const text = formatMarkupTextNode(child);
      if (text) parts.push('  '.repeat(depth + 1) + text);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      parts.push(serializeElement(child as Element, depth + 1));
    }
  }
  parts.push(`${pad}</${tag}>`);
  return parts.join('\n');
}
