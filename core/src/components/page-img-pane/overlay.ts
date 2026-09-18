import { svg, render } from 'lit';
import type { TemplateResult } from 'lit';
import { layerClassForValue } from '../../doclang/dom';
import type {
  BoundingBox,
  CaptionLink,
  XrefLink,
  FragmentLink,
  FragmentNavItem,
} from '../../doclang/types';

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
}

export type ArrowLayerKey = 'readingOrder' | 'fragment' | 'xref' | 'caption';

export interface ArrowLayerMeta {
  cssKey: string;
  colorVar: string;
  markerId: string;
  defaultStyle: 'solid' | 'dashed' | 'dotted';
}

export interface ArrowStyleConfig {
  color?: string;
  width?: number;
  head?: number;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface OverlayLinkOptions {
  markerId: string;
  markerLayer?: ArrowLayerKey;
  linkClass: string;
  fromIdAttr: string;
  toIdAttr: string;
}

export interface PageLayoutCache {
  paneW: number;
  paneH: number;
  imgW: number;
  imgH: number;
  fitScale: number;
}

const OVERLAY_BADGE_FONT_SIZE = 11 * 1.5 * 0.8;
const OVERLAY_BADGE_PAD_X = 3;
const OVERLAY_BADGE_PAD_Y = 2;
const OVERLAY_BADGE_RADIUS_SCREEN_PX = 3;
/** Demo page size; overlay lengths are calibrated to match pre-fix sizing on these images. */
const OVERLAY_REF_IMAGE_WIDTH = 1224;
const OVERLAY_REF_IMAGE_HEIGHT = 1584;
export const PAGE_VIEW_BORDER_PX = 2;
export const PAGE_ZOOM_DEFAULT = 100;
export const FRAGMENT_NAV_HINT_PREV = 'Previous fragment';
export const FRAGMENT_NAV_HINT_NEXT = 'Next fragment';
const FRAGMENT_LINK_LABEL_CROSS_PAGE = 'cross-page content';
const FRAGMENT_LINK_LABEL_SAME_PAGE = 'fragmented content';

export const ARROW_LAYERS: Record<ArrowLayerKey, ArrowLayerMeta> = {
  readingOrder: {
    cssKey: 'reading-order',
    colorVar: '--overlay-reading-order',
    markerId: 'reading-order-arrowhead',
    defaultStyle: 'dashed',
  },
  fragment: {
    cssKey: 'fragment',
    colorVar: '--overlay-fragment',
    markerId: 'fragment-arrowhead',
    defaultStyle: 'dashed',
  },
  xref: {
    cssKey: 'xref',
    colorVar: '--kind-footnote',
    markerId: 'xref-arrowhead',
    defaultStyle: 'solid',
  },
  caption: {
    cssKey: 'caption',
    colorVar: '--kind-caption',
    markerId: 'caption-arrowhead',
    defaultStyle: 'solid',
  },
};

export const ARROW_STYLE_FIELD_DEFAULTS = { width: 1.5, head: 5 };
export const ARROW_DASH_VALUES: Record<string, string> = {
  solid: 'none',
  dashed: '6 4',
  dotted: '1.5 3.5',
};

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
// Overlay context — passed explicitly by page-img-pane instead of globals
// ---------------------------------------------------------------------------
export interface OverlayCtx {
  zoomPct: number;
  pane: HTMLElement;
  layoutCache: PageLayoutCache | null;
  setLayoutCache: (c: PageLayoutCache) => void;
  selectedId: string | null;
  arrowMarkerOptions?: (layerKey: ArrowLayerKey) => { size: number; color: string };
}

// ---------------------------------------------------------------------------
// Page layout helpers
// ---------------------------------------------------------------------------

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
  const zoom = ctx.zoomPct / PAGE_ZOOM_DEFAULT;
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

export function sortedOverlayBoxes(
  boxes: BoundingBox[],
  selectedId: string | null
): BoundingBox[] {
  const layerPriority = (layer: string) =>
    layer === 'background' ? 0 : layer === 'furniture' ? 1 : 2;
  const kindPriority = (box: BoundingBox) => {
    if (box.kind === 'text') return 0;
    if (box.kind === 'list' || box.kind === 'table' || box.kind === 'index' || box.kind === 'tabular') return 2;
    return 1;
  };
  return [...boxes].sort((a, b) => {
    const byLayer = layerPriority(a.layer ?? 'body') - layerPriority(b.layer ?? 'body');
    if (byLayer !== 0) return byLayer;
    const byKind = kindPriority(a) - kindPriority(b);
    if (byKind !== 0) return byKind;
    if (selectedId) {
      const aSelected = a.elementId === selectedId;
      const bSelected = b.elementId === selectedId;
      if (aSelected !== bSelected) return aSelected ? 1 : -1;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Arrow marker template
// ---------------------------------------------------------------------------

export function ensureArrowMarker(
  defs: SVGDefsElement,
  markerId: string,
  opts: { size?: number; color?: string } = {}
): void {
  const size = opts.size ?? ARROW_STYLE_FIELD_DEFAULTS.head;
  const color = opts.color || 'currentColor';
  defs.querySelector(`#${markerId}`)?.remove();
  render(
    svg`<marker
      id=${markerId}
      viewBox="0 0 6 6"
      refX="6"
      refY="3"
      markerWidth=${size}
      markerHeight=${size}
      orient="auto"
    ><path d="M0,0 L6,3 L0,6 Z" fill=${color}></path></marker>`,
    defs
  );
}

// ---------------------------------------------------------------------------
// SVG template builders
// ---------------------------------------------------------------------------

function dashedLineAttrs(
  start: { x: number; y: number },
  end: { x: number; y: number }
): { strokeDasharray: string; strokeDashoffset: string } {
  const dash = 6;
  const gap = 4;
  const period = dash + gap;
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  if (!len) return { strokeDasharray: '', strokeDashoffset: '' };
  const offset = len % period;
  return {
    strokeDasharray: `${dash} ${gap}`,
    strokeDashoffset: offset > 0.01 ? String(offset) : '',
  };
}

function arrowMarkerTemplate(
  markerId: string,
  opts: { size?: number; color?: string } = {}
): TemplateResult {
  const size = opts.size ?? ARROW_STYLE_FIELD_DEFAULTS.head;
  const color = opts.color || 'currentColor';
  return svg`
    <marker id=${markerId} viewBox="0 0 6 6"
      refX="6" refY="3"
      markerWidth=${size} markerHeight=${size}
      orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill=${color}></path>
    </marker>`;
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

function overlayBadgeTemplate(
  svgEl: SVGSVGElement,
  anchorX: number,
  anchorY: number,
  text: string | number,
  extraClass: string,
  elementId: string,
  ctx: OverlayCtx
): TemplateResult {
  const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
  const { width, height } = overlayBadgeLayout(svgEl, text, fontSize, ctx);
  const radius = overlayUserLength(OVERLAY_BADGE_RADIUS_SCREEN_PX, ctx);
  return svg`
    <g class=${`overlay-badge ${extraClass}`} data-element-id=${elementId}>
      <rect class="overlay-badge-bg"
        x=${anchorX - width / 2} y=${anchorY - height / 2}
        width=${width} height=${height}
        rx=${radius} ry=${radius}></rect>
      <text class="overlay-badge-label"
        x=${anchorX} y=${anchorY}
        font-size=${fontSize}>${text}</text>
    </g>`;
}

// ---------------------------------------------------------------------------
// Link overlay templates
// ---------------------------------------------------------------------------

function overlayLinkTemplate(
  img: HTMLImageElement,
  link: CaptionLink | XrefLink,
  opts: OverlayLinkOptions
): TemplateResult {
  const fromBox = (link as CaptionLink).captionBox ?? (link as XrefLink).fromBox;
  const toBox = (link as CaptionLink).hostBox ?? (link as XrefLink).toBox;
  const start = boxCenter(boxPixelRect(fromBox, img));
  const end = boxCenter(boxPixelRect(toBox, img));
  const fromId =
    (link as CaptionLink).captionElementId ?? (link as XrefLink).fromElementId;
  const toId = (link as CaptionLink).hostElementId ?? (link as XrefLink).toElementId;
  return svg`
    <line
      class=${opts.linkClass}
      x1=${start.x} y1=${start.y}
      x2=${end.x} y2=${end.y}
      marker-end=${`url(#${opts.markerId})`}
      ${opts.fromIdAttr}=${fromId}
      ${opts.toIdAttr}=${toId}
    ></line>`;
}

function fragmentNavButtonTemplate(
  x: number,
  y: number,
  size: number,
  radius: number,
  fontSize: number,
  direction: string,
  label: string,
  enabled: boolean
): TemplateResult {
  const hintText = direction === 'prev' ? FRAGMENT_NAV_HINT_PREV : FRAGMENT_NAV_HINT_NEXT;
  const cls = `fragment-nav-btn fragment-nav-btn-${direction}${enabled ? '' : ' fragment-nav-btn-disabled'}`;
  return svg`
    <g class=${cls} data-nav=${direction}
      role=${enabled ? 'button' : ''}
      aria-label=${enabled ? hintText : ''}
    >
      ${enabled ? svg`<title>${hintText}</title>` : ''}
      <rect class="fragment-nav-btn-bg"
        x=${x} y=${y} width=${size} height=${size}
        rx=${radius} ry=${radius}></rect>
      <text class="fragment-nav-btn-label"
        x=${x + size / 2} y=${y + size / 2}
        font-size=${fontSize}>${label}</text>
    </g>`;
}

// ---------------------------------------------------------------------------
// Full overlay render — called by both buildOverlay and syncOverlayBadges
// ---------------------------------------------------------------------------

interface OverlayRenderParams {
  img: HTMLImageElement;
  boxes: BoundingBox[];
  captionLinks?: CaptionLink[];
  xrefLinks?: XrefLink[];
  readingOrderSteps?: { order: number; box: BoundingBox; elementId: string }[];
  fragmentLinks?: FragmentLink[];
  fragmentNavItems?: FragmentNavItem[];
  showAllBboxes: boolean;
  showLayoutBadges: boolean;
  showReadingOrder: boolean;
  ctx: OverlayCtx;
}

function renderOverlaySvgContent(svgEl: SVGSVGElement, p: OverlayRenderParams): void {
  const {
    img,
    boxes,
    captionLinks = [],
    xrefLinks = [],
    readingOrderSteps = [],
    fragmentLinks = [],
    fragmentNavItems = [],
    showAllBboxes,
    showLayoutBadges,
    showReadingOrder,
    ctx,
  } = p;

  const markerOpts = (key: ArrowLayerKey) =>
    ctx.arrowMarkerOptions ? ctx.arrowMarkerOptions(key) : {};

  // --- Badges: computed after layout, requires getBBox probe on svgEl ---
  const badges: TemplateResult[] = [];
  if (img.naturalWidth) {
    const fontSize = overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx);
    const badgeGap = overlayUserLength(2, ctx);
    const readingOrderByElementId = new Map(
      showAllBboxes && showReadingOrder
        ? readingOrderSteps.map(s => [s.elementId, s])
        : []
    );
    for (const b of sortedOverlayBoxes(boxes, ctx.selectedId)) {
      const { x, y } = boxPixelRect(b, img);
      let tagLayout = { width: 0 };
      if (showAllBboxes && showLayoutBadges) {
        tagLayout = overlayBadgeLayout(svgEl, b.tag, fontSize, ctx);
        badges.push(overlayBadgeTemplate(svgEl, x, y, b.tag, `element-badge ${kindClassForTag(b.kind)}`, b.elementId, ctx));
      }
      const step = readingOrderByElementId.get(b.elementId);
      if (step) {
        const orderText = String(step.order);
        const orderLayout = overlayBadgeLayout(svgEl, orderText, fontSize, ctx);
        const orderAnchorX =
          showAllBboxes && showLayoutBadges
            ? x + tagLayout.width / 2 + badgeGap + orderLayout.width / 2
            : x;
        badges.push(overlayBadgeTemplate(svgEl, orderAnchorX, y, orderText, 'reading-order-badge', b.elementId, ctx));
      }
    }
  }

  // --- Fragment links ---
  const fragmentLinkTemplates = fragmentLinks.map(link => {
    const fromRect = boxPixelRect(link.fromBox, img);
    let lineTmpl: TemplateResult;
    let labelAt: { x: number; y: number };
    if (link.toBox) {
      const start = boxCenter(fromRect);
      const end = boxCenter(boxPixelRect(link.toBox, img));
      const { strokeDasharray, strokeDashoffset } = dashedLineAttrs(start, end);
      lineTmpl = svg`<line class="fragment-link-path fragment-link-path-dashed"
        x1=${start.x} y1=${start.y} x2=${end.x} y2=${end.y}
        marker-end="url(#fragment-arrowhead)"
        stroke-dasharray=${strokeDasharray}
        stroke-dashoffset=${strokeDashoffset}></line>`;
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    } else {
      const inset = overlayUserLength(5, ctx);
      const corner = link.targetCorner ?? 'br';
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;
      const cornerPoint =
        corner === 'tl'
          ? { x: Math.min(inset, imgW - inset), y: Math.min(inset, imgH - inset) }
          : { x: Math.max(imgW - inset, inset), y: Math.max(imgH - inset, inset) };
      const elementAnchor = boxCenter(fromRect);
      const incoming = corner === 'tl';
      const start = incoming ? cornerPoint : elementAnchor;
      const end = incoming ? elementAnchor : cornerPoint;
      const { strokeDasharray, strokeDashoffset } = dashedLineAttrs(start, end);
      lineTmpl = svg`<line class="fragment-link-path fragment-link-path-dashed"
        x1=${start.x} y1=${start.y} x2=${end.x} y2=${end.y}
        marker-end="url(#fragment-arrowhead)"
        stroke-dasharray=${strokeDasharray}
        stroke-dashoffset=${strokeDashoffset}></line>`;
      labelAt = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    }
    return svg`
      <g class="fragment-link"
        data-thread-id=${link.threadId}
        data-fragment-from-id=${link.fromElementId}
        data-fragment-to-id=${link.toElementId ?? ''}
      >
        ${lineTmpl}
        <text class="fragment-link-label"
          x=${labelAt.x} y=${labelAt.y}
          font-size=${overlayUserLength(OVERLAY_BADGE_FONT_SIZE, ctx)}
        >${link.toBox ? FRAGMENT_LINK_LABEL_SAME_PAGE : FRAGMENT_LINK_LABEL_CROSS_PAGE}</text>
      </g>`;
  });

  // --- Fragment nav buttons ---
  const fragmentNavTemplates = fragmentNavItems.map(item => {
    const btnSize = overlayUserLength(13 * 1.5, ctx);
    const gap = overlayUserLength(2, ctx);
    const inset = overlayUserLength(3, ctx);
    const fontSize = overlayUserLength(10 * 1.5, ctx);
    const radius = overlayUserLength(2 * 1.5, ctx);
    const { x, y, w, h } = boxPixelRect(item.box, img);
    const rowY = y + h - inset - btnSize;
    const nextX = x + w - inset - btnSize;
    const prevX = nextX - gap - btnSize;
    return svg`
      <g class="fragment-nav" data-element-id=${item.elementId}>
        ${fragmentNavButtonTemplate(prevX, rowY, btnSize, radius, fontSize, 'prev', '‹', item.hasPrev)}
        ${fragmentNavButtonTemplate(nextX, rowY, btnSize, radius, fontSize, 'next', '›', item.hasNext)}
      </g>`;
  });

  // --- Reading order lines ---
  const readingOrderLines: TemplateResult[] = [];
  for (let i = 0; i < readingOrderSteps.length - 1; i += 1) {
    const start = boxCenter(boxPixelRect(readingOrderSteps[i]!.box, img));
    const end = boxCenter(boxPixelRect(readingOrderSteps[i + 1]!.box, img));
    readingOrderLines.push(svg`
      <line class="reading-order-step"
        x1=${start.x} y1=${start.y} x2=${end.x} y2=${end.y}
        marker-end="url(#reading-order-arrowhead)"
      ></line>`);
  }

  render(
    svg`
      <defs>
        <pattern id="layer-hatch" width="16" height="16"
          patternUnits="userSpaceOnUse" patternTransform="rotate(45 8 8)">
          <rect class="layer-hatch-stripe" x="10" y="-4" width="6" height="24"></rect>
        </pattern>
        ${readingOrderSteps.length >= 2 ? arrowMarkerTemplate('reading-order-arrowhead', markerOpts('readingOrder')) : ''}
        ${fragmentLinks.length ? arrowMarkerTemplate('fragment-arrowhead', markerOpts('fragment')) : ''}
        ${captionLinks.length ? arrowMarkerTemplate('caption-arrowhead', markerOpts('caption')) : ''}
        ${xrefLinks.length ? arrowMarkerTemplate('xref-arrowhead', markerOpts('xref')) : ''}
      </defs>
      ${captionLinks.map(link => overlayLinkTemplate(img, link, { markerId: 'caption-arrowhead', markerLayer: 'caption', linkClass: 'caption-link', fromIdAttr: 'data-caption-id', toIdAttr: 'data-host-id' }))}
      ${xrefLinks.map(link => overlayLinkTemplate(img, link, { markerId: 'xref-arrowhead', markerLayer: 'xref', linkClass: 'xref-link', fromIdAttr: 'data-xref-from-id', toIdAttr: 'data-xref-to-id' }))}
      ${fragmentLinkTemplates}
      ${readingOrderLines}
      ${sortedOverlayBoxes(boxes, ctx.selectedId).map(b => {
        const { x, y, w, h } = boxPixelRect(b, img);
        const cls = bboxClassForKind(b.kind);
        const kindClass = kindClassForTag(b.kind);
        const layerClass = layerClassForValue(b.layer ?? 'body');
        return svg`<rect
          class=${`bbox bbox-${cls} ${kindClass}${layerClass ? ` ${layerClass}` : ''}`}
          x=${x} y=${y}
          width=${Math.max(w, 1)} height=${Math.max(h, 1)}
          data-element-id=${b.elementId}
        ></rect>`;
      })}
      ${fragmentNavTemplates}
      ${badges}
    `,
    svgEl
  );
}

// ---------------------------------------------------------------------------
// Public API — kept stable for page-img-pane callers
// ---------------------------------------------------------------------------

export function syncOverlayBadges(
  img: HTMLImageElement,
  svgEl: SVGSVGElement,
  boxes: BoundingBox[],
  readingOrderSteps: { order: number; box: BoundingBox; elementId: string }[],
  showAllBboxes: boolean,
  showLayoutBadges: boolean,
  showReadingOrder: boolean,
  ctx: OverlayCtx
): void {
  renderOverlaySvgContent(svgEl, {
    img,
    boxes,
    readingOrderSteps,
    showAllBboxes,
    showLayoutBadges,
    showReadingOrder,
    ctx,
  });
}

export function buildOverlay(
  img: HTMLImageElement,
  boxes: BoundingBox[],
  captionLinks: CaptionLink[] = [],
  xrefLinks: XrefLink[] = [],
  readingOrderSteps: { order: number; box: BoundingBox; elementId: string }[] = [],
  fragmentLinks: FragmentLink[] = [],
  fragmentNavItems: FragmentNavItem[] = [],
  onSelectElement: (id: string) => void,
  onNavigateFragment: (elementId: string, direction: string) => void,
  onClearSelection: () => void,
  getPagPanSuppressClick: () => boolean,
  setPagPanSuppressClick: (v: boolean) => void,
  ctx: OverlayCtx
): SVGSVGElement {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.classList.add('overlay');
  svgEl.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
  svgEl.setAttribute('overflow', 'hidden');

  renderOverlaySvgContent(svgEl, {
    img,
    boxes,
    captionLinks,
    xrefLinks,
    readingOrderSteps,
    fragmentLinks,
    fragmentNavItems,
    showAllBboxes: false,
    showLayoutBadges: false,
    showReadingOrder: false,
    ctx,
  });

  svgEl.addEventListener('click', e => {
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
    const ctm = svgEl.getScreenCTM()?.inverse();
    if (ctm) {
      const pt = svgEl.createSVGPoint();
      pt.x = (e as MouseEvent).clientX;
      pt.y = (e as MouseEvent).clientY;
      const { x, y } = pt.matrixTransform(ctm);
      const hit = hitTestBoxes(boxes, img, x, y);
      if (hit) onSelectElement(hit.elementId);
      else onClearSelection();
    }
  });

  svgEl.addEventListener('mousemove', e => {
    const ctm = svgEl.getScreenCTM()?.inverse();
    if (ctm) {
      const pt = svgEl.createSVGPoint();
      pt.x = (e as MouseEvent).clientX;
      pt.y = (e as MouseEvent).clientY;
      const { x, y } = pt.matrixTransform(ctm);
      svgEl.style.cursor = hitTestBoxes(boxes, img, x, y) ? 'pointer' : '';
    }
  });
  svgEl.addEventListener('mouseleave', () => {
    svgEl.style.cursor = '';
  });

  return svgEl;
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
