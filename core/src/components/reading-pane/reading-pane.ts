/** <doclang-reading-pane> — reading/rendered view with layers settings panel */

import { DoclangHTMLElement } from '../base/base';
import styles from './reading-pane.css?inline';
import template from './reading-pane.html?raw';

export class DoclangReadingPane extends DoclangHTMLElement {
  private _body: HTMLElement;
  private _settingsToggle: HTMLButtonElement;
  private _settingsLayer: HTMLElement;
  private _settingsScrim: HTMLButtonElement;
  private _settingsClose: HTMLButtonElement;
  private _showFurniture: HTMLInputElement;
  private _showFurnitureLabel: HTMLLabelElement;
  private _showBackground: HTMLInputElement;
  private _showBackgroundLabel: HTMLLabelElement;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-reading');
    this._body = this.q('.pane-body');
    this._settingsToggle = this.q('.pane-settings-toggle');
    this._settingsLayer = this.q('.viewer-settings-layer');
    this._settingsScrim = this.q('.viewer-settings-scrim');
    this._settingsClose = this.q('.viewer-settings-close');
    this._showFurnitureLabel = this.q('label:has(.cb-furniture)');
    this._showFurniture = this.q('.cb-furniture');
    this._showBackgroundLabel = this.q('label:has(.cb-background)');
    this._showBackground = this.q('.cb-background');

    this._wireEvents();
  }

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
  get showFurniture(): HTMLInputElement {
    return this._showFurniture;
  }
  get showFurnitureLabel(): HTMLLabelElement {
    return this._showFurnitureLabel;
  }
  get showBackground(): HTMLInputElement {
    return this._showBackground;
  }
  get showBackgroundLabel(): HTMLLabelElement {
    return this._showBackgroundLabel;
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

  syncCheckboxes(furniture: boolean, background: boolean): void {
    this._showFurniture.checked = furniture;
    this._showBackground.checked = background;
  }

  private _wireEvents(): void {
    this._settingsToggle.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-toggle', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsClose.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._settingsScrim.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reading-settings-close', {
          bubbles: true,
          composed: true,
        })
      )
    );
    this._showFurniture.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-furniture', {
          bubbles: true,
          composed: true,
          detail: { checked: this._showFurniture.checked },
        })
      )
    );
    this._showBackground.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-show-reading-background', {
          bubbles: true,
          composed: true,
          detail: { checked: this._showBackground.checked },
        })
      )
    );
  }
}

customElements.define('doclang-reading-pane', DoclangReadingPane);
