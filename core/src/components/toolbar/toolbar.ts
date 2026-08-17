/** <doclang-toolbar> — header toolbar (Views menu, file open, demo, site link) */

import { DoclangHTMLElement } from '../base/base';
import styles from './toolbar.css?inline';
import template from './toolbar.html?raw';

export class DoclangToolbar extends DoclangHTMLElement {
  private _toolbarOptionsBtn: HTMLButtonElement;
  private _toolbarOptionsPanel: HTMLDivElement;
  private _toggleFilePane: HTMLInputElement;
  private _toggleFilePaneLabel: HTMLLabelElement;
  private _togglePagePane: HTMLInputElement;
  private _togglePagePaneLabel: HTMLLabelElement;
  private _toggleMarkupPane: HTMLInputElement;
  private _toggleMarkupPaneLabel: HTMLLabelElement;
  private _toggleReadingPane: HTMLInputElement;
  private _toggleReadingPaneLabel: HTMLLabelElement;
  private _resetPaneLayoutBtn: HTMLButtonElement;
  private _btnDemo: HTMLButtonElement;
  private _openFileBtn: HTMLLabelElement;
  private _inputArchive: HTMLInputElement;
  private _panelOpen = false;

  constructor() {
    super(styles, template);
    this._toolbarOptionsBtn = this.q('.toolbar-options-btn');
    this._toolbarOptionsPanel = this.q('.toolbar-options-panel');
    this._toggleFilePaneLabel = this.q('label:has(.cb-file-pane)');
    this._toggleFilePane = this.q('.cb-file-pane');
    this._togglePagePaneLabel = this.q('label:has(.cb-page-pane)');
    this._togglePagePane = this.q('.cb-page-pane');
    this._toggleMarkupPaneLabel = this.q('label:has(.cb-markup-pane)');
    this._toggleMarkupPane = this.q('.cb-markup-pane');
    this._toggleReadingPaneLabel = this.q('label:has(.cb-reading-pane)');
    this._toggleReadingPane = this.q('.cb-reading-pane');
    this._resetPaneLayoutBtn = this.q('.toolbar-options-reset');
    this._btnDemo = this.q('.btn-demo');
    this._openFileBtn = this.q('.file-btn');
    this._inputArchive = this.q('.input-archive');

    this._wireEvents();
  }

  get toggleFilePane(): HTMLInputElement {
    return this._toggleFilePane;
  }
  get toggleFilePaneLabel(): HTMLLabelElement {
    return this._toggleFilePaneLabel;
  }
  get togglePagePane(): HTMLInputElement {
    return this._togglePagePane;
  }
  get togglePagePaneLabel(): HTMLLabelElement {
    return this._togglePagePaneLabel;
  }
  get toggleMarkupPane(): HTMLInputElement {
    return this._toggleMarkupPane;
  }
  get toggleMarkupPaneLabel(): HTMLLabelElement {
    return this._toggleMarkupPaneLabel;
  }
  get toggleReadingPane(): HTMLInputElement {
    return this._toggleReadingPane;
  }
  get toggleReadingPaneLabel(): HTMLLabelElement {
    return this._toggleReadingPaneLabel;
  }
  get resetPaneLayoutBtn(): HTMLButtonElement {
    return this._resetPaneLayoutBtn;
  }
  get toolbarOptionsBtn(): HTMLButtonElement {
    return this._toolbarOptionsBtn;
  }
  get btnDemo(): HTMLButtonElement {
    return this._btnDemo;
  }
  get openFileBtn(): HTMLLabelElement {
    return this._openFileBtn;
  }
  get inputArchive(): HTMLInputElement {
    return this._inputArchive;
  }

  setOptionsOpen(open: boolean): void {
    this._panelOpen = open;
    this._toolbarOptionsPanel.hidden = !open;
    this._toolbarOptionsBtn.setAttribute('aria-expanded', String(open));
  }

  closeOptionsIfOpen(): void {
    if (this._panelOpen) this.setOptionsOpen(false);
  }

  private _wireEvents(): void {
    this._toolbarOptionsBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.setOptionsOpen(!this._panelOpen);
    });
    // Close when clicking outside
    document.addEventListener('click', (e: MouseEvent) => {
      if (!this._panelOpen) return;
      const path = e.composedPath();
      if (
        path.includes(this._toolbarOptionsPanel) ||
        path.includes(this._toolbarOptionsBtn)
      )
        return;
      this.setOptionsOpen(false);
    });
    this._btnDemo.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-load-demo', { bubbles: true, composed: true })
      )
    );
    this._inputArchive.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      this.dispatchEvent(
        new CustomEvent('doclang-open-files', {
          bubbles: true,
          composed: true,
          detail: { files: [...(input.files ?? [])] },
        })
      );
      input.value = '';
    });
    this._toggleFilePane.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-toggle-pane', {
          bubbles: true,
          composed: true,
          detail: { pane: 'file', checked: this._toggleFilePane.checked },
        })
      )
    );
    this._togglePagePane.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-toggle-pane', {
          bubbles: true,
          composed: true,
          detail: { pane: 'page', checked: this._togglePagePane.checked },
        })
      )
    );
    this._toggleMarkupPane.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-toggle-pane', {
          bubbles: true,
          composed: true,
          detail: { pane: 'markup', checked: this._toggleMarkupPane.checked },
        })
      )
    );
    this._toggleReadingPane.addEventListener('change', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-toggle-pane', {
          bubbles: true,
          composed: true,
          detail: { pane: 'reading', checked: this._toggleReadingPane.checked },
        })
      )
    );
    this._resetPaneLayoutBtn.addEventListener('click', () =>
      this.dispatchEvent(
        new CustomEvent('doclang-reset-pane-layout', { bubbles: true, composed: true })
      )
    );
  }
}

customElements.define('doclang-toolbar', DoclangToolbar);
