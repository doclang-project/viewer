/** <doclang-page-view-pane> — page image with zoom and overlay settings panel */

import { DoclangHTMLElement } from '../base/base';
import styles from './page-view-pane.css?inline';
import template from './page-view-pane.html?raw';

export class DoclangPageViewPane extends DoclangHTMLElement {
  private _body: HTMLElement;
  private _settingsToggle: HTMLButtonElement;
  private _settingsLayer: HTMLElement;
  private _settingsScrim: HTMLButtonElement;
  private _settingsClose: HTMLButtonElement;
  private _zoomLabel: HTMLDivElement;
  private _zoomInput: HTMLInputElement;
  private _zoomReset: HTMLButtonElement;
  private _showAllBboxes: HTMLInputElement;
  private _showAllBboxesLabel: HTMLLabelElement;
  private _layoutSubtoggles: HTMLDivElement;
  private _showLayoutBadges: HTMLInputElement;
  private _showLayoutBadgesLabel: HTMLLabelElement;
  private _showReadingOrder: HTMLInputElement;
  private _showReadingOrderLabel: HTMLLabelElement;
  private _readingOrderSubtoggles: HTMLDivElement;
  private _readingOrderArrows: HTMLInputElement;
  private _readingOrderArrowsLabel: HTMLLabelElement;
  private _readingOrderGlobal: HTMLInputElement;
  private _readingOrderGlobalLabel: HTMLLabelElement;
  private _showPictureContents: HTMLInputElement;
  private _showPictureContentsLabel: HTMLLabelElement;
  private _showTableContents: HTMLInputElement;
  private _showTableContentsLabel: HTMLLabelElement;
  private _showFragmentLinks: HTMLInputElement;
  private _showFragmentLinksLabel: HTMLLabelElement;
  private _showXrefLinks: HTMLInputElement;
  private _showXrefLinksLabel: HTMLLabelElement;
  private _showCaptionLinks: HTMLInputElement;
  private _showCaptionLinksLabel: HTMLLabelElement;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-page-view');
    this._body = this.q('.pane-body');
    this._zoomLabel = this.q('.page-zoom-control');
    this._zoomInput = this.q('.zoom-input');
    this._zoomReset = this.q('.page-zoom-reset');
    this._settingsToggle = this.q('.pane-settings-toggle');
    this._settingsLayer = this.q('.viewer-settings-layer');
    this._settingsScrim = this.q('.viewer-settings-scrim');
    this._settingsClose = this.q('.viewer-settings-close');
    this._showAllBboxesLabel = this.q('label:has(.cb-all-bboxes)');
    this._showAllBboxes = this.q('.cb-all-bboxes');
    this._layoutSubtoggles = this.q('.settings-subgroup');
    this._showReadingOrderLabel = this.q('label:has(.cb-reading-order)');
    this._showReadingOrder = this.q('.cb-reading-order');
    this._readingOrderSubtoggles = this.q('.settings-reading-order-group');
    this._readingOrderArrowsLabel = this.q('label:has(.cb-reading-order-arrows)');
    this._readingOrderArrows = this.q('.cb-reading-order-arrows');
    this._readingOrderGlobalLabel = this.q('label:has(.cb-reading-order-global)');
    this._readingOrderGlobal = this.q('.cb-reading-order-global');
    this._showPictureContentsLabel = this.q('label:has(.cb-picture-contents)');
    this._showPictureContents = this.q('.cb-picture-contents');
    this._showTableContentsLabel = this.q('label:has(.cb-table-contents)');
    this._showTableContents = this.q('.cb-table-contents');
    this._showFragmentLinksLabel = this.q('label:has(.cb-fragment-links)');
    this._showFragmentLinks = this.q('.cb-fragment-links');
    this._showXrefLinksLabel = this.q('label:has(.cb-xref-links)');
    this._showXrefLinks = this.q('.cb-xref-links');
    this._showCaptionLinksLabel = this.q('label:has(.cb-caption-links)');
    this._showCaptionLinks = this.q('.cb-caption-links');
    this._showLayoutBadgesLabel = this.q('label:has(.cb-layout-badges)');
    this._showLayoutBadges = this.q('.cb-layout-badges');

    this._wireEvents();
  }

  // Accessors for main.ts
  get section(): HTMLElement {
    return this;
  }
  get body(): HTMLElement {
    return this._body;
  }
  get settingsToggle(): HTMLButtonElement {
    return this._settingsToggle;
  }
  get settingsLayer(): HTMLElement {
    return this._settingsLayer;
  }
  get zoomLabel(): HTMLDivElement {
    return this._zoomLabel;
  }
  get zoomInput(): HTMLInputElement {
    return this._zoomInput;
  }
  get zoomReset(): HTMLButtonElement {
    return this._zoomReset;
  }
  get showAllBboxes(): HTMLInputElement {
    return this._showAllBboxes;
  }
  get showAllBboxesLabel(): HTMLLabelElement {
    return this._showAllBboxesLabel;
  }
  get showLayoutBadges(): HTMLInputElement {
    return this._showLayoutBadges;
  }
  get showLayoutBadgesLabel(): HTMLLabelElement {
    return this._showLayoutBadgesLabel;
  }
  get showReadingOrder(): HTMLInputElement {
    return this._showReadingOrder;
  }
  get showReadingOrderLabel(): HTMLLabelElement {
    return this._showReadingOrderLabel;
  }
  get readingOrderArrows(): HTMLInputElement {
    return this._readingOrderArrows;
  }
  get readingOrderArrowsLabel(): HTMLLabelElement {
    return this._readingOrderArrowsLabel;
  }
  get readingOrderGlobal(): HTMLInputElement {
    return this._readingOrderGlobal;
  }
  get readingOrderGlobalLabel(): HTMLLabelElement {
    return this._readingOrderGlobalLabel;
  }
  get showPictureContents(): HTMLInputElement {
    return this._showPictureContents;
  }
  get showPictureContentsLabel(): HTMLLabelElement {
    return this._showPictureContentsLabel;
  }
  get showTableContents(): HTMLInputElement {
    return this._showTableContents;
  }
  get showTableContentsLabel(): HTMLLabelElement {
    return this._showTableContentsLabel;
  }
  get showFragmentLinks(): HTMLInputElement {
    return this._showFragmentLinks;
  }
  get showFragmentLinksLabel(): HTMLLabelElement {
    return this._showFragmentLinksLabel;
  }
  get showXrefLinks(): HTMLInputElement {
    return this._showXrefLinks;
  }
  get showXrefLinksLabel(): HTMLLabelElement {
    return this._showXrefLinksLabel;
  }
  get showCaptionLinks(): HTMLInputElement {
    return this._showCaptionLinks;
  }
  get showCaptionLinksLabel(): HTMLLabelElement {
    return this._showCaptionLinksLabel;
  }
  get layoutSubtoggles(): HTMLDivElement {
    return this._layoutSubtoggles;
  }
  get readingOrderSubtoggles(): HTMLDivElement {
    return this._readingOrderSubtoggles;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  setLastPane(isLast: boolean): void {
    this.classList.toggle('pane-layout-last', isLast);
  }

  setSettingsOpen(open: boolean): void {
    this._settingsLayer.hidden = !open;
    this._settingsToggle.setAttribute('aria-expanded', String(open));
  }

  private _wireEvents(): void {
    this._settingsToggle.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-page-settings-toggle', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsClose.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-page-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsScrim.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-page-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._zoomInput.addEventListener('input', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-zoom-change', {
          bubbles: true,
          composed: true,
          detail: { value: Number(this._zoomInput.value) },
        })
      )
    );
    this._zoomReset.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-zoom-reset', { bubbles: true, composed: true })
      )
    );
    for (const [el, name] of [
      [this._showAllBboxes, 'doclang-show-all-bboxes'],
      [this._showLayoutBadges, 'doclang-show-layout-badges'],
      [this._showReadingOrder, 'doclang-show-reading-order'],
      [this._readingOrderArrows, 'doclang-reading-order-arrows'],
      [this._readingOrderGlobal, 'doclang-reading-order-global'],
      [this._showPictureContents, 'doclang-show-picture-contents'],
      [this._showTableContents, 'doclang-show-table-contents'],
      [this._showFragmentLinks, 'doclang-show-fragment-links'],
      [this._showXrefLinks, 'doclang-show-xref-links'],
      [this._showCaptionLinks, 'doclang-show-caption-links'],
    ] as [HTMLInputElement, string][]) {
      el.addEventListener('change', () =>
        this.dispatchEvent(
          new CustomEvent(name, {
            bubbles: true,
            composed: true,
            detail: { checked: el.checked },
          })
        )
      );
    }
  }
}

customElements.define('doclang-page-view-pane', DoclangPageViewPane);
