import type { PaneKey } from '../constants';

export interface BoundingBox {
  kind: string;
  tag: string;
  elementId: string;
  layer: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  resW: number;
  resH: number;
}

export interface Resolution {
  width: number;
  height: number;
}

export interface PageViewOverlay {
  boxes: BoundingBox[];
  readingOrderSteps: ReadingOrderStep[];
}

export interface ReadingOrderStep {
  order: number;
  box: BoundingBox;
  elementId: string;
}

export interface CaptionLink {
  captionBox: BoundingBox;
  hostBox: BoundingBox;
  captionElementId: string;
  hostElementId: string;
}

export interface XrefLink {
  fromBox: BoundingBox;
  toBox: BoundingBox;
  fromElementId: string;
  toElementId: string;
}

export interface FragmentLink {
  fromBox: BoundingBox;
  toBox: BoundingBox | null;
  fromElementId: string;
  toElementId: string | null;
  threadId: string;
  targetCorner?: 'tl' | 'br';
}

export interface FragmentNavItem {
  elementId: string;
  box: BoundingBox;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface ThreadNav {
  prev: Element | null;
  next: Element | null;
}

export interface DocumentState {
  pageImages: Map<number, string>;
  assetUrls: Map<string, string>;
  currentPage: number;
  pageCount: number;
  segments: Element[][];
  defaultResolution: Resolution;
  elementIds: Map<Element, string>;
  idToElement: Map<string, Element>;
  hasPageView: boolean;
  markupOnly: boolean;
  docRoot: Element;
  threadPagesById: Map<string, Set<number>>;
  elementPageByEl: Map<Element, number>;
  threadNavByElement: Map<Element, ThreadNav>;
  pendingSelectElement: Element | null;
  readingOrder: Element[];
  readingOrderDisplayNumbers: Map<Element, number>;
  pageViewOverlay: PageViewOverlay | null;
}

export type FileCatalogEntryKind = 'archive' | 'markup' | 'folder';

export interface FileCatalogEntry {
  id: string;
  label: string;
  kind: FileCatalogEntryKind;
  source: File | ArrayBuffer | File[];
  currentPage: number;
  pageZoom: number;
  snapshot: DocumentState | null;
  thumbnailUrl: string | null;
}

export interface PageLayoutCache {
  paneW: number;
  paneH: number;
  imgW: number;
  imgH: number;
  fitScale: number;
}

export interface PagePanDrag {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

export interface PaneDragState {
  physicalSplitterIndex: number;
  leftKey: PaneKey;
  rightKey: PaneKey;
  startX: number;
  leftStart: number;
  rightStart: number;
  pointerId: number;
  leftStartPx?: number;
  rightStartPx?: number;
}

export interface UserPaneVisible {
  file: boolean;
  page: boolean;
  markup: boolean;
  reading: boolean;
}

export interface OtslCell {
  kind: string;
  token: Element;
  contentNodes: Node[];
  colspan: number;
  rowspan: number;
  covered?: boolean;
}

export interface ParsedOtslCell {
  kind: string;
  token: Element;
  contentNodes: Node[];
}

export interface RenderCtx {
  inline: boolean;
  trimLeading?: boolean;
}

export interface HeadInfo {
  key: string;
  value: string;
  isDefault: boolean;
}

export interface OverlayLinkOptions {
  markerId: string;
  linkClass: string;
  fromIdAttr: string;
  toIdAttr: string;
}

export interface ParsedElementHead {
  locs: Element[];
  nextIndex: number;
}

export interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
  area: number;
}
