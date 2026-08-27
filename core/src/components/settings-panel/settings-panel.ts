/** <doclang-settings-panel> — floating settings panel + scrim overlay */

import { LitElement, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import styles from './settings-panel.css?inline';

/**
 * A floating settings panel with a scrim backdrop.
 * Positioned absolutely over its nearest positioned ancestor.
 *
 * The trigger button lives in the consumer (pane header). Call setOpen(true/false)
 * from the trigger, or pass `open` via attribute.
 *
 * Attributes:
 *   label   — text for the panel title and close button aria-label
 *
 * The panel body content is provided via the default slot.
 *
 * Events fired (bubbles, composed):
 *   doclang-settings-close  — when the panel closes itself (scrim or close button)
 */
@customElement('doclang-settings-panel')
export class DoclangSettingsPanel extends LitElement {
  static override styles = unsafeCSS(styles);

  @property({ type: String }) label = '';

  private _open = false;
  private _titleId = `settings-title-${Math.random().toString(36).slice(2)}`;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._onDocKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onDocKeydown);
  }

  override render() {
    if (!this._open) return nothing;
    return html`
      <div class="settings-layer">
        <button
          type="button"
          class="settings-scrim"
          tabindex="-1"
          aria-label="Close ${this.label}"
          @click=${this._onClose}
        ></button>
        <aside
          class="settings-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby=${this._titleId}
        >
          <div class="settings-header">
            <h2 class="settings-title" id=${this._titleId}>${this.label}</h2>
            <button
              type="button"
              class="settings-close"
              aria-label="Close ${this.label}"
              @click=${this._onClose}
            >
              ×
            </button>
          </div>
          <div class="settings-body">
            <slot></slot>
          </div>
        </aside>
      </div>
    `;
  }

  setOpen(open: boolean): void {
    if (this._open === open) return;
    this._open = open;
    this.requestUpdate();
    if (!open) {
      this.dispatchEvent(
        new CustomEvent('doclang-settings-close', { bubbles: true, composed: true })
      );
    }
  }

  get isOpen(): boolean {
    return this._open;
  }

  private _onClose = (): void => {
    this.setOpen(false);
  };

  private _onDocKeydown = (e: KeyboardEvent): void => {
    if (this._open && e.key === 'Escape') this.setOpen(false);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'doclang-settings-panel': DoclangSettingsPanel;
  }
}
