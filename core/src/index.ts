/** DocLang Viewer — public API barrel */

// Components (register custom elements as a side-effect and re-export the class)
export { DoclangViewer } from './components/viewer/viewer';
export { DoclangPaneStack } from './components/container/pane-stack';
export { DoclangCollectionPane } from './components/collection/collection-pane';
export { DoclangMarkupPane } from './components/markup-pane/markup-pane';
export { DoclangPageImgPane } from './components/page-img-pane/page-img-pane';
export { DoclangReadingPane } from './components/reading-pane/reading-pane';
export { DoclangPageNav } from './components/page-nav/page-nav';
export { DoclangToolbar } from './components/viewer/toolbar';
export { DoclangDropdown } from './components/dropdown/dropdown';
export { DoclangSettingsPanel } from './components/settings-panel/settings-panel';
export { DoclangEmpty } from './components/viewer/empty';

// Base classes / controllers
export { DoclangPageElement } from './components/base/page-element';
export { PageController } from './components/base/page-controller';
export { CollectionController } from './components/collection/collection';

// DocLang data-model types
export type {
  BoundingBox,
  Resolution,
  PageViewOverlay,
  ReadingOrderStep,
  CaptionLink,
  XrefLink,
  FragmentLink,
  FragmentNavItem,
  ThreadNav,
  DocumentState,
  FileCatalogEntryKind,
  FileCatalogEntry,
} from './doclang/types';
