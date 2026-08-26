/** <doclang-dropdown> — reusable trigger-button + dropdown panel */

import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import styles from './dropdown.css?inline';

/**
 * A button that toggles a floating dropdown panel below it.
 *
 * Attributes:
 *   label   — text shown on the trigger button
 *
 * The dropdown content is provided via the default slot.
 *
 * The host closes the panel when a click occurs outside this element,
 * or when setOpen(false) is called externally.
 */
@customElement('doclang-dropdown')
export class DoclangDropdown extends LitElement {
  static override styles = unsafeCSS(styles);

  @property({ type: String }) label = '';

  private _open = false;

  override render() {
    return html`
      <div class="dropdown-wrap">
        <button
          type="button"
          class="dropdown-btn"
          aria-expanded=${this._open ? 'true' : 'false'}
          aria-haspopup="true"
          @click=${this._onBtnClick}
        >
          ${this.label}
        </button>
        ${this._open
          ? html`<div class="dropdown-panel" role="menu"><slot></slot></div>`
          : nothing}
      </div>
    `;
  }

  setOpen(open: boolean): void {
    this._open = open;
    this.requestUpdate();
  }

  get isOpen(): boolean {
    return this._open;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick);
  }

  private _onBtnClick = (e: Event): void => {
    e.stopPropagation();
    this.setOpen(!this._open);
  };

  private _onDocClick = (e: Event): void => {
    if (!this._open) return;
    if (e.composedPath().includes(this as unknown as EventTarget)) return;
    this.setOpen(false);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'doclang-dropdown': DoclangDropdown;
  }
}
