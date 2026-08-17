// Re-exports from xml.ts plus overlay-specific helpers
export {
  childElements,
  localName,
  headLocations,
  firstHeadChild,
  walkElements,
  locationResolution,
  isCellToken,
  skipContainerLevelHead,
  skipUntilListItemBoundary,
  skipUntilCellBoundary,
  parseElementHeadAt,
  elementLayer,
  elementLabel,
  layerClassForValue,
  elementThreadId,
  isVirtualTextOverlayUnit,
} from './xml';
import { localName } from './xml';
import { OTSL_CONTAINER_TAGS } from './constants';

export function isPictureContentElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = localName(el);
  if (tag === 'picture' || tag === 'caption') return false;
  let node: Element | null = el.parentElement;
  while (node) {
    if (localName(node) === 'picture') return true;
    node = node.parentElement;
  }
  return false;
}

export function isTableContentElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = localName(el);
  if (OTSL_CONTAINER_TAGS.has(tag) || tag === 'caption') return false;
  let node: Element | null = el.parentElement;
  while (node) {
    if (OTSL_CONTAINER_TAGS.has(localName(node))) return true;
    node = node.parentElement;
  }
  return false;
}

export function elementKindKey(kind: string): string {
  if (kind.startsWith('field_') || kind === 'key' || kind === 'value' || kind === 'hint')
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
