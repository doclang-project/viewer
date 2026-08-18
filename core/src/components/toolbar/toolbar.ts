/** <doclang-toolbar> — header toolbar (Views menu, file open, demo, site link) */

import { DoclangHTMLElement } from '../base/base';
import styles from './toolbar.css?inline';
import template from './toolbar.html?raw';
import { OPEN_FILE_HINT } from '../../constants';

export class DoclangToolbar extends DoclangHTMLElement {
  private _toolbarOptionsBtn: HTMLButtonElement;
  private _toolbarOptionsPanel: HTMLDivElement;
  private _toggleFilePane: HTMLInputElement;
  private _toggleFilePaneLabel: HTMLLabelElement;
  private _togglePagePane: HTMLInputElement;
  private _togglePagePaneLabel: HTMLLabelElement;
  private _toggleMarkupPane: HTMLInputElement;
  private _toggleReadingPane: HTMLInputElement;
  private _resetPaneLayoutBtn: HTMLButtonElement;
  private _btnDemo: HTMLButtonElement;
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
    this.q<HTMLLabelElement>('label:has(.cb-markup-pane)'); // not stored; handled via syncPaneToggles
    this._toggleMarkupPane = this.q('.cb-markup-pane');
    this.q<HTMLLabelElement>('label:has(.cb-reading-pane)'); // not stored; label state is toggled via syncPaneToggles
    this._toggleReadingPane = this.q('.cb-reading-pane');
    this._resetPaneLayoutBtn = this.q('.toolbar-options-reset');
    this._btnDemo = this.q('.btn-demo');
    this._inputArchive = this.q('.input-archive');

    this._wireEvents();
    this._wireHints();
  }

  /** Sync the Views-menu checkboxes and disabled/greyed state from app state. */
  syncPaneToggles(opts: {
    file: boolean;
    page: boolean;
    markup: boolean;
    reading: boolean;
    fileAvailable: boolean;
    pageAvailable: boolean;
    hasState: boolean;
  }): void {
    this._toggleFilePane.checked = opts.fileAvailable && opts.file;
    this._toggleFilePane.disabled = !opts.fileAvailable;
    this._toggleFilePaneLabel.classList.toggle(
      'toolbar-options-item-disabled',
      !opts.fileAvailable
    );

    this._togglePagePane.checked = opts.pageAvailable && opts.page;
    this._togglePagePane.disabled = !opts.pageAvailable;
    this._togglePagePaneLabel.classList.toggle(
      'toolbar-options-item-disabled',
      !opts.pageAvailable
    );

    this._toggleMarkupPane.checked = opts.markup;
    this._toggleMarkupPane.disabled = !opts.hasState;

    this._toggleReadingPane.checked = opts.reading;
    this._toggleReadingPane.disabled = !opts.hasState;

    // Sync label disabled class for markup/reading (labels don't have stored refs)
    for (const input of [this._toggleMarkupPane, this._toggleReadingPane]) {
      const label = input.closest('label');
      label?.classList.toggle('toolbar-options-item-disabled', input.disabled);
    }

    this._resetPaneLayoutBtn.disabled = !opts.hasState;
  }

  setDemoLoading(loading: boolean): void {
    this._btnDemo.disabled = loading;
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

  private _wireHints(): void {
    const fileBtn = this.shadow.querySelector('.file-btn');
    if (!fileBtn) return;
    fileBtn.addEventListener('mousemove', e => {
      this.dispatchEvent(
        new CustomEvent('doclang-hint', {
          bubbles: true,
          composed: true,
          detail: {
            text: OPEN_FILE_HINT,
            clientX: (e as MouseEvent).clientX,
            clientY: (e as MouseEvent).clientY,
          },
        })
      );
    });
    fileBtn.addEventListener('mouseleave', () => {
      this.dispatchEvent(
        new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
      );
    });
  }
}

customElements.define('doclang-toolbar', DoclangToolbar);
