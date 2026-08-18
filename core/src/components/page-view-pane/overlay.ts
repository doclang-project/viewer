import {
  OVERLAY_BADGE_FONT_SIZE,
  OVERLAY_BADGE_PAD_X,
  OVERLAY_BADGE_PAD_Y,
  OVERLAY_BADGE_RADIUS_SCREEN_PX,
  OVERLAY_REF_IMAGE_WIDTH,
  OVERLAY_REF_IMAGE_HEIGHT,
  PAGE_VIEW_BORDER_PX,
  PAGE_ZOOM_DEFAULT,
  FRAGMENT_LINK_LABEL_CROSS_PAGE,
  FRAGMENT_LINK_LABEL_SAME_PAGE,
  FRAGMENT_NAV_HINT_PREV,
  FRAGMENT_NAV_HINT_NEXT,
} from '../../constants';
import { layerClassForValue } from '../../doclang/dom';
import type {
  BoundingBox,
  Resolution,
  PixelRect,
  CaptionLink,
  XrefLink,
  FragmentLink,
  FragmentNavItem,
  OverlayLinkOptions,
  PageLayoutCache,
} from '../../doclang/types';

// ---------------------------------------------------------------------------
// Overlay box CSS class helpers
// ---------------------------------------------------------------------------

export function elementKindKey(kind: string): string {
  if (
    kind.startsWith('field_') ||
    kind === 'key' ||
    kind === 'value' ||
    kind === 'hint'
  )
    return 'field';
  if (kind === 'tabular') return 'table';
  const known = new Set([
    'text',
    'heading',
    'list',
    'ldiv',
    'table',
    'index',
    'formula',
    'code',
    'picture',
    'group',
    'footnote',
    'page_header',
    'page_footer',
    'caption',
  ]);
  return known.has(kind) ? kind : 'default';
}

export function kindClassForTag(tag: string): string {
  return `kind-${elementKindKey(tag)}`;
}

export function bboxClassForKind(kind: string): string {
  return elementKindKey(kind);
}

// ---------------------------------------------------------------------------
// Overlay context — passed explicitly by page-view-pane instead of globals
// ---------------------------------------------------------------------------
export interface OverlayCtx {
  zoomPct: number;
  pane: HTMLElement;
  layoutCache: PageLayoutCache | null;
  setLayoutCache: (c: PageLayoutCache) => void;
  selectedId: string | null;
}

// ---------------------------------------------------------------------------
// Page layout helpers
// ---------------------------------------------------------------------------

function pageZoomFactor(ctx: OverlayCtx): number {
  return ctx.zoomPct / PAGE_ZOOM_DEFAULT;
}

function paneContentSize(pane: HTMLElement): { w: number; h: number } {
  const style = getComputedStyle(pane);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  return { w: pane.clientWidth - padX, h: pane.clientHeight - padY };
}

export function getCachedFitScale(
  img: HTMLImageElement,
  pane: HTMLElement,
  ctx: OverlayCtx
): number {
  const { w: paneW, h: paneH } = paneContentSize(pane);
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const cache = ctx.layoutCache;
  if (
    cache &&
    cache.paneW === paneW &&
    cache.paneH === paneH &&
    cache.imgW === imgW &&
    cache.imgH === imgH
  ) {
    return cache.fitScale;
  }
  const fitScale =
    paneW > 0 && paneH > 0 && imgW > 0 && imgH > 0
      ? Math.min(
          (paneW - PAGE_VIEW_BORDER_PX) / imgW,
          (paneH - PAGE_VIEW_BORDER_PX) / imgH
        )
      : 1;
  ctx.setLayoutCache({ paneW, paneH, imgW, imgH, fitScale });
  return fitScale;
}

export function overlayUserLength(
  baseUserPx: number,
  ctx: OverlayCtx,
  img?: HTMLImageElement | null
): number {
  const resolvedImg =
    img ?? (ctx.pane.querySelector('.page-view img') as HTMLImageElement | null);
  const zoom = pageZoomFactor(ctx);
  if (!(zoom > 0)) return baseUserPx;
  const { pane } = ctx;
  if (!resolvedImg?.naturalWidth || !resolvedImg.naturalHeight) {
    return baseUserPx / zoom;
  }

  const { w: paneW, h: paneH } = paneContentSize(pane);
  if (!(paneW > 0 && paneH > 0)) return baseUserPx / zoom;

  const refFit = Math.min(
    (paneW - PAGE_VIEW_BORDER_PX) / OVERLAY_REF_IMAGE_WIDTH,
    (paneH - PAGE_VIEW_BORDER_PX) / OVERLAY_REF_IMAGE_HEIGHT
  );
  const fitScale = getCachedFitScale(resolvedImg, pane, ctx);
  if (!(refFit > 0) || !(fitScale > 0)) return baseUserPx / zoom;

  return (baseUserPx * refFit) / (fitScale * zoom);
}

export function applyPageImageSize(
  img: HTMLImageElement,
  pane: HTMLElement,
  ctx: OverlayCtx
): boolean {
  if (!img?.naturalWidth || !img.naturalHeight) return false;
  const zoomPct = Math.max(PAGE_ZOOM_DEFAULT, ctx.zoomPct);
  const fitScale = getCachedFitScale(img, pane, ctx);
  const scale = fitScale * (zoomPct / PAGE_ZOOM_DEFAULT);
  const w = Math.floor(img.naturalWidth * scale);
  const h = Math.floor(img.naturalHeight * scale);
  const nextW = `${w}px`;
  const nextH = `${h}px`;
  const unchanged = img.style.width === nextW && img.style.height === nextH;
  if (!unchanged) {
    img.style.width = nextW;
    img.style.height = nextH;
    img.style.maxWidth = 'none';
    img.style.maxHeight = 'none';
  }
  img.dataset.layoutReady = '1';
  return !unchanged;
}

// ---------------------------------------------------------------------------
// Bounding box pixel rect
// ---------------------------------------------------------------------------

export function boxPixelRect(b: BoundingBox, img: HTMLImageElement): PixelRect {
  const x = (b.x0 / b.resW) * img.naturalWidth;
  const y = (b.y0 / b.resH) * img.naturalHeight;
  const w = ((b.x1 - b.x0) / b.resW) * img.naturalWidth;
  const h = ((b.y1 - b.y0) / b.resH) * img.naturalHeight;
  return { x, y, w, h, area: w * h };
}

function boxCenter(rect: PixelRect): { x: number; y: number } {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

// ---------------------------------------------------------------------------
// Overlay sort helpers
// ---------------------------------------------------------------------------

function overlayBoxPaintPriority(box: BoundingBox): number {
  if (box.kind === 'text') return 0;
  if (
    box.kind === 'list' ||
    box.kind === 'table' ||
    box.kind === 'index' ||
    box.kind === 'tabular'
  ) {
    return 2;
  }
  return 1;
}

function overlayLayerPriority(layer: string): number {
  if (layer === 'background') return 0;
  if (layer === 'furniture') return 1;
  return 2;
}

function compareOverlayBoxPaintOrder(
  a: BoundingBox,
  b: BoundingBox,
  selectedId: string | null
): number {
  const byLayer =
    overlayLayerPriority(a.layer ?? 'body') - overlayLayerPriority(b.layer ?? 'body');
  if (byLayer !== 0) return byLayer;
  const byPriority = overlayBoxPaintPriority(a) - overlayBoxPaintPriority(b);
  if (byPriority !== 0) return byPriority;
  if (selectedId) {
    const aSelected = a.elementId === selectedId;
    const bSelected = b.elementId === selectedId;
    if (aSelected !== bSelected) return aSelected ? 1 : -1;
  }
  return 0;
}

export function sortedOverlayBoxes(
  boxes: BoundingBox[],
  selectedId: string | null
): BoundingBox[] {
  return [...boxes].sort((a, b) => compareOverlayBoxPaintOrder(a, b, selectedId));
}

// ---------------------------------------------------------------------------
// SVG helper functions
// ---------------------------------------------------------------------------

function ensureArrowMarker(defs: SVGDefsElement, markerId: string): void {
  if (defs.querySelector(`#${markerId}`)) return;
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('viewBox', '0 0 6 6');
  marker.setAttribute('refX', '6');
  marker.setAttribute('refY', '3');
  marker.setAttribute('markerWidth', '5');
  marker.setAttribute('markerHeight', '5');
  marker.setAttribute('orient', 'auto');
  const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  arrowPath.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
  arrowPath.setAttribute('fill', 'currentColor');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);
}

function alignDashedLineToEnd(
  line: SVGLineElement,
  start: { x: number; y: number },
  end: { x: number; y: number }
): void {
  const dash = 6;
  const gap = 4;
  const period = dash + gap;
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  if (!len) return;
  line.setAttribute('stroke-dasharray', `${dash} ${gap}`);
  const offset = len % period;
  if (offset > 0.01) line.setAttribute('stroke-dashoffset', String(offset));
}

function ensureLayerHatchPatterns(defs: SVGDefsElement): void {
  if (defs.querySelector('#layer-hatch')) return;
  const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
  pattern.setAttribute('id', 'layer-hatch');
  pattern.setAttribute('width', '16');
  pattern.setAttribute('height', '16');
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  pattern.setAttribute('patternTransform', 'rotate(45 8 8)');
  const stripe = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  stripe.setAttribute('class', 'layer-hatch-stripe');
  stripe.setAttribute('x', '10');
  stripe.setAttribute('y', '-4');
  stripe.setAttribute('width', '6');
  stripe.setAttribute('height', '24');
  pattern.appendChild(stripe);
  defs.appendChild(pattern);
}

function ensureOverlayDefs(svg: SVGSVGElement): SVGDefsElement {
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

// ---------------------------------------------------------------------------
// Overlay badge rendering
// ---------------------------------------------------------------------------

function overlayBadgeLayout(
  svg: SVGSVGElement,
  text: string | number,
  fontSizeUser: number,
  ctx: OverlayCtx
): { width: number; height: number } {
  const padXUser = overlayUserLength(OVERLAY_BADGE_PAD_X, ctx);
  const padYUser = overlayUserLength(OVERLAY_BADGE_PAD_Y, ctx);
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  probe.setAttribute('class', 'overlay-badge-label');
  probe.setAttribute('font-size', String(fontSizeUser));
  probe.setAttribute('font-weight', '700');
  probe.setAttribute('text-anchor', 'start');
  probe.setAttribute('dominant-baseline', 'text-before-edge');
  probe.setAttribute('visibility', 'hidden');
  probe.textContent = String(text);
  svg.appendChild(probe);

  let width: number;
  let height: number;
  try {
    const bbox = probe.getBBox();
    width = bbox.width + padXUser * 2;
    height = bbox.height + padYUser * 2;
  } catch {
    const label = String(text);
    width = overlayUserLength(
      label.length * OVERLAY_BADGE_FONT_SIZE * 0.55 + OVERLAY_BADGE_PAD_X * 2,
      ctx
    );
    height = overlayUserLength(
      OVERLAY_BADGE_FONT_SIZE * 1.1 + OVERLAY_BADGE_PAD_Y * 2,
      ctx
    );
  }
  probe.remove();
  return { width, height };
}

export function appendOverlayBadge(
  svg: SVGSVGElement,
  anchorX: number,
  anchorY: number,
  text: string | number,
  { extraClass, elementId }: { extraClass: string; elementId: string },
  ctx: OverlayCtx
): SVGGElement {
  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
  const { width, height } = overlayBadgeLayout(svg, text, fontSize, ctx);
  const radius = overlayUserLength(OVERLAY_BADGE_RADIUS_SCREEN_PX, ctx);

  const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  badge.setAttribute('class', `overlay-badge ${extraClass}`);
  badge.setAttribute('data-element-id', elementId);

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('class', 'overlay-badge-bg');
  bg.setAttribute('x', String(anchorX - width / 2));
  bg.setAttribute('y', String(anchorY - height / 2));
  bg.setAttribute('width', String(width));
  bg.setAttribute('height', String(height));
  bg.setAttribute('rx', String(radius));
  bg.setAttribute('ry', String(radius));
  badge.appendChild(bg);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('class', 'overlay-badge-label');
  label.setAttribute('x', String(anchorX));
  label.setAttribute('y', String(anchorY));
  label.setAttribute('font-size', String(fontSize));
  label.textContent = String(text);
  badge.appendChild(label);

  svg.appendChild(badge);
  return badge;
}

export function syncOverlayBadges(
  img: HTMLImageElement,
  svg: SVGSVGElement,
  boxes: BoundingBox[],
  readingOrderSteps: { order: number; box: BoundingBox; elementId: string }[],
  showAllBboxes: boolean,
  showLayoutBadges: boolean,
  showReadingOrder: boolean,
  ctx: OverlayCtx
): void {
  if (!img.naturalWidth) return;

  svg.querySelectorAll('.element-badge, .reading-order-badge').forEach(b => b.remove());

  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
  const badgeGap = overlayUserLength(2, ctx);
  const readingOrderByElementId = new Map<
    string,
    { order: number; box: BoundingBox; elementId: string }
  >();
  if (showAllBboxes && showReadingOrder) {
    for (const step of readingOrderSteps) {
      readingOrderByElementId.set(step.elementId, step);
    }
  }

  const sorted = sortedOverlayBoxes(boxes, ctx.selectedId);

  for (const b of sorted) {
    const { x, y } = boxPixelRect(b, img);
    let tagLayout = { width: 0 };
    if (showAllBboxes && showLayoutBadges) {
      tagLayout = overlayBadgeLayout(svg, b.tag, fontSize, ctx);
      appendOverlayBadge(
        svg,
        x,
        y,
        b.tag,
        {
          extraClass: `element-badge ${kindClassForTag(b.kind)}`,
          elementId: b.elementId,
        },
        ctx
      );
    }

    const step = readingOrderByElementId.get(b.elementId);
    if (step) {
      const orderText = String(step.order);
      const orderLayout = overlayBadgeLayout(svg, orderText, fontSize, ctx);
      const orderAnchorX =
        showAllBboxes && showLayoutBadges
          ? x + tagLayout.width / 2 + badgeGap + orderLayout.width / 2
          : x;
      appendOverlayBadge(
        svg,
        orderAnchorX,
        y,
        orderText,
        {
          extraClass: 'reading-order-badge',
          elementId: b.elementId,
        },
        ctx
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Link overlays
// ---------------------------------------------------------------------------

function appendOverlayLinks(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  links: (CaptionLink | XrefLink)[],
  { markerId, linkClass, fromIdAttr, toIdAttr }: OverlayLinkOptions
): void {
  if (!links.length) return;
  const defs = ensureOverlayDefs(svg);
  ensureArrowMarker(defs, markerId);

  for (const link of links) {
    const fromBox = (link as CaptionLink).captionBox ?? (link as XrefLink).fromBox;
    const toBox = (link as CaptionLink).hostBox ?? (link as XrefLink).toBox;
    const from = boxPixelRect(fromBox, img);
    const to = boxPixelRect(toBox, img);
    const start = boxCenter(from);
    const end = boxCenter(to);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', linkClass);
    line.setAttribute('x1', String(start.x));
    line.setAttribute('y1', String(start.y));
    line.setAttribute('x2', String(end.x));
    line.setAttribute('y2', String(end.y));
    line.setAttribute('marker-end', `url(#${markerId})`);
    const fromId =
      (link as CaptionLink).captionElementId ?? (link as XrefLink).fromElementId;
    const toId = (link as CaptionLink).hostElementId ?? (link as XrefLink).toElementId;
    line.setAttribute(fromIdAttr, fromId);
    line.setAttribute(toIdAttr, toId);
    svg.appendChild(line);
  }
}

export function appendCaptionLinks(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  captionLinks: CaptionLink[]
): void {
  appendOverlayLinks(svg, img, captionLinks, {
    markerId: 'caption-arrowhead',
    linkClass: 'caption-link',
    fromIdAttr: 'data-caption-id',
    toIdAttr: 'data-host-id',
  });
}

export function appendXrefLinks(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  xrefLinks: XrefLink[]
): void {
  appendOverlayLinks(svg, img, xrefLinks, {
    markerId: 'xref-arrowhead',
    linkClass: 'xref-link',
    fromIdAttr: 'data-xref-from-id',
    toIdAttr: 'data-xref-to-id',
  });
}

function docPointToPixel(
  xDoc: number,
  yDoc: number,
  resW: number,
  resH: number,
  img: HTMLImageElement
): { x: number; y: number } {
  return {
    x: (xDoc / resW) * img.naturalWidth,
    y: (yDoc / resH) * img.naturalHeight,
  };
}

function pageCornerTarget(
  img: HTMLImageElement,
  defaultResolution: Resolution,
  corner: 'tl' | 'br',
  ctx: OverlayCtx
): { x: number; y: number } {
  const { width: resW, height: resH } = defaultResolution;
  const inset = overlayUserLength(5, ctx);
  const tl = docPointToPixel(0, 0, resW, resH, img);
  const br = docPointToPixel(resW, resH, resW, resH, img);
  if (corner === 'tl') {
    return {
      x: Math.min(tl.x + inset, br.x - inset),
      y: Math.min(tl.y + inset, br.y - inset),
    };
  }
  return {
    x: Math.max(br.x - inset, tl.x + inset),
    y: Math.max(br.y - inset, tl.y + inset),
  };
}

export function appendFragmentLinks(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  links: FragmentLink[],
  defaultResolution: Resolution,
  ctx: OverlayCtx
): void {
  if (!links.length) return;
  const defs = ensureOverlayDefs(svg);
  ensureArrowMarker(defs, 'fragment-arrowhead');
  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);

  for (const link of links) {
    const fromRect = boxPixelRect(link.fromBox, img);

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'fragment-link');
    group.setAttribute('data-thread-id', link.threadId);
    group.setAttribute('data-fragment-from-id', link.fromElementId);
    if (link.toElementId) group.setAttribute('data-fragment-to-id', link.toElementId);

    let labelAt: { x: number; y: number };
    if (link.toBox) {
      const toRect = boxPixelRect(link.toBox, img);
      const start = boxCenter(fromRect);
      const end = boxCenter(toRect);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'fragment-link-path fragment-link-path-dashed');
      line.setAttribute('x1', String(start.x));
      line.setAttribute('y1', String(start.y));
      line.setAttribute('x2', String(end.x));
      line.setAttribute('y2', String(end.y));
      line.setAttribute('marker-end', 'url(#fragment-arrowhead)');
      alignDashedLineToEnd(line, start, end);
      group.appendChild(line);
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    } else {
      const corner = link.targetCorner ?? 'br';
      const cornerPoint = pageCornerTarget(img, defaultResolution, corner, ctx);
      const elementAnchor = boxCenter(fromRect);
      const incoming = corner === 'tl';
      const start = incoming ? cornerPoint : elementAnchor;
      const end = incoming ? elementAnchor : cornerPoint;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'fragment-link-path fragment-link-path-dashed');
      line.setAttribute('x1', String(start.x));
      line.setAttribute('y1', String(start.y));
      line.setAttribute('x2', String(end.x));
      line.setAttribute('y2', String(end.y));
      line.setAttribute('marker-end', 'url(#fragment-arrowhead)');
      alignDashedLineToEnd(line, start, end);
      group.appendChild(line);
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    }

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('class', 'fragment-link-label');
    text.setAttribute('x', String(labelAt.x));
    text.setAttribute('y', String(labelAt.y));
    text.setAttribute('font-size', String(fontSize));
    text.textContent = link.toBox
      ? FRAGMENT_LINK_LABEL_SAME_PAGE
      : FRAGMENT_LINK_LABEL_CROSS_PAGE;
    group.appendChild(text);

    svg.appendChild(group);
  }
}

export function appendFragmentNavButtons(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  items: FragmentNavItem[],
  ctx: OverlayCtx
): void {
  if (!items.length) return;

  const btnSize = overlayUserLength(13 * 1.5, ctx);
  const gap = overlayUserLength(2, ctx);
  const inset = overlayUserLength(3, ctx);
  const fontSize = overlayUserLength(10 * 1.5, ctx);
  const radius = overlayUserLength(2 * 1.5, ctx);

  for (const item of items) {
    const { x, y, w, h } = boxPixelRect(item.box, img);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'fragment-nav');
    group.setAttribute('data-element-id', item.elementId);

    const rowY = y + h - inset - btnSize;
    const nextX = x + w - inset - btnSize;
    const prevX = nextX - gap - btnSize;

    appendFragmentNavButton(
      group,
      prevX,
      rowY,
      btnSize,
      radius,
      fontSize,
      'prev',
      '‹',
      item.hasPrev
    );
    appendFragmentNavButton(
      group,
      nextX,
      rowY,
      btnSize,
      radius,
      fontSize,
      'next',
      '›',
      item.hasNext
    );

    svg.appendChild(group);
  }
}

function appendFragmentNavButton(
  group: SVGGElement,
  x: number,
  y: number,
  size: number,
  radius: number,
  fontSize: number,
  direction: string,
  label: string,
  enabled: boolean
): void {
  const btn = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  btn.setAttribute(
    'class',
    `fragment-nav-btn fragment-nav-btn-${direction}${enabled ? '' : ' fragment-nav-btn-disabled'}`
  );
  btn.setAttribute('data-nav', direction);
  if (enabled) {
    btn.setAttribute('role', 'button');
    btn.setAttribute(
      'aria-label',
      direction === 'prev' ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT
    );
  }

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('class', 'fragment-nav-btn-bg');
  bg.setAttribute('x', String(x));
  bg.setAttribute('y', String(y));
  bg.setAttribute('width', String(size));
  bg.setAttribute('height', String(size));
  bg.setAttribute('rx', String(radius));
  bg.setAttribute('ry', String(radius));
  btn.appendChild(bg);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('class', 'fragment-nav-btn-label');
  text.setAttribute('x', String(x + size / 2));
  text.setAttribute('y', String(y + size / 2));
  text.setAttribute('font-size', String(fontSize));
  text.textContent = label;
  btn.appendChild(text);

  group.appendChild(btn);
}

export function appendReadingOrderOverlay(
  svg: SVGSVGElement,
  img: HTMLImageElement,
  steps: { box: BoundingBox }[]
): void {
  if (!steps.length) return;
  if (steps.length >= 2) {
    const defs = ensureOverlayDefs(svg);
    ensureArrowMarker(defs, 'reading-order-arrowhead');
    for (let i = 0; i < steps.length - 1; i += 1) {
      const from = boxPixelRect(steps[i]!.box, img);
      const to = boxPixelRect(steps[i + 1]!.box, img);
      const start = boxCenter(from);
      const end = boxCenter(to);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'reading-order-step');
      line.setAttribute('x1', String(start.x));
      line.setAttribute('y1', String(start.y));
      line.setAttribute('x2', String(end.x));
      line.setAttribute('y2', String(end.y));
      line.setAttribute('marker-end', 'url(#reading-order-arrowhead)');
      svg.appendChild(line);
    }
  }
}

export function buildOverlay(
  img: HTMLImageElement,
  boxes: BoundingBox[],
  captionLinks: CaptionLink[] = [],
  xrefLinks: XrefLink[] = [],
  readingOrderSteps: { order: number; box: BoundingBox; elementId: string }[] = [],
  fragmentLinks: FragmentLink[] = [],
  fragmentNavItems: FragmentNavItem[] = [],
  defaultResolution: Resolution = { width: 512, height: 512 },
  onSelectElement: (id: string) => void,
  onNavigateFragment: (elementId: string, direction: string) => void,
  onClearSelection: () => void,
  getPagPanSuppressClick: () => boolean,
  setPagPanSuppressClick: (v: boolean) => void,
  ctx: OverlayCtx
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('overlay');
  svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  svg.setAttribute('overflow', 'hidden');

  appendCaptionLinks(svg, img, captionLinks);
  appendXrefLinks(svg, img, xrefLinks);
  appendFragmentLinks(svg, img, fragmentLinks, defaultResolution, ctx);
  appendReadingOrderOverlay(svg, img, readingOrderSteps);

  const defs = ensureOverlayDefs(svg);
  ensureLayerHatchPatterns(defs);

  for (const b of sortedOverlayBoxes(boxes, ctx.selectedId)) {
    const { x, y, w, h } = boxPixelRect(b, img);
    const cls = bboxClassForKind(b.kind);
    const kindClass = kindClassForTag(b.kind);
    const layerClass = layerClassForValue(b.layer ?? 'body');

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute(
      'class',
      `bbox bbox-${cls} ${kindClass}${layerClass ? ` ${layerClass}` : ''}`
    );
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(Math.max(w, 1)));
    rect.setAttribute('height', String(Math.max(h, 1)));
    rect.setAttribute('data-element-id', b.elementId);
    svg.appendChild(rect);
  }

  appendFragmentNavButtons(svg, img, fragmentNavItems, ctx);

  svg.addEventListener('click', e => {
    if (getPagPanSuppressClick()) {
      setPagPanSuppressClick(false);
      return;
    }
    const target = e.target as Element;
    const navBtn = target.closest('.fragment-nav-btn:not(.fragment-nav-btn-disabled)');
    if (navBtn) {
      e.stopPropagation();
      const navGroup = navBtn.closest('.fragment-nav');
      const elementId = navGroup?.getAttribute('data-element-id');
      const direction = navBtn.getAttribute('data-nav');
      if (elementId && direction) onNavigateFragment(elementId, direction);
      return;
    }
    const badge = target.closest('.overlay-badge[data-element-id]');
    if (badge) {
      const id = badge.getAttribute('data-element-id');
      if (id) onSelectElement(id);
      return;
    }
    const coords = imageCoordsFromEvent(svg, e as MouseEvent);
    if (!coords) return;
    const hit = hitTestBoxes(boxes, img, coords.x, coords.y);
    if (hit) onSelectElement(hit.elementId);
    else onClearSelection();
  });

  svg.addEventListener('mousemove', e => {
    const coords = imageCoordsFromEvent(svg, e as MouseEvent);
    svg.style.cursor =
      coords && hitTestBoxes(boxes, img, coords.x, coords.y) ? 'pointer' : '';
  });
  svg.addEventListener('mouseleave', () => {
    svg.style.cursor = '';
  });

  return svg;
}

function imageCoordsFromEvent(
  svg: SVGSVGElement,
  evt: MouseEvent
): { x: number; y: number } | null {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM()?.inverse();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm);
  return { x: p.x, y: p.y };
}

export function hitTestBoxes(
  boxes: BoundingBox[],
  img: HTMLImageElement,
  x: number,
  y: number
): BoundingBox | null {
  let best: BoundingBox | null = null;
  let bestArea = Infinity;
  for (const b of boxes) {
    const { x: bx, y: by, w, h, area } = boxPixelRect(b, img);
    if (x >= bx && x <= bx + w && y >= by && y <= by + h && area < bestArea) {
      best = b;
      bestArea = area;
    }
  }
  return best;
}
