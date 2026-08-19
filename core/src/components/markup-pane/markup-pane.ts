/** <doclang-markup-pane> — DocLang XML markup view */

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { unsafeCSS } from 'lit';
import { ref, createRef } from 'lit/directives/ref.js';
import type { Ref } from 'lit/directives/ref.js';
import { DoclangPageElement } from '../base/page-element';
import styles from './markup-pane.css?inline';
import {
  assignElementIds,
  invertElementIds,
  segmentHasMarkup,
  NO_MARKUP,
} from '../../doclang/document';
import { buildMarkupView, VIRTUAL_TEXT_TAG_HINT } from './markup';

@customElement('doclang-markup-pane')
export class DoclangMarkupPane extends DoclangPageElement {
  static override styles = unsafeCSS(styles);

  private _bodyRef: Ref<HTMLElement> = createRef();

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('pane', 'pane-markup');
    this.addEventListener('mousemove', this._onMousemove);
    this.addEventListener('mouseleave', this._onMouseleave);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('mousemove', this._onMousemove);
    this.removeEventListener('mouseleave', this._onMouseleave);
  }

  override render() {
    return html`
      <div class="pane-header">DocLang</div>
      <div class="pane-body" id="markup-pane" ${ref(this._bodyRef)}></div>
    `;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  protected override _applySelection(): void {
    const body = this._bodyRef.value;
    if (!body) return;
    for (const el of body.querySelectorAll('.markup-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this._selectedId) return;
    const target =
      body.querySelector(
        `.markup-el-virtual-text[data-element-id="${this._selectedId}"]`
      ) ?? body.querySelector(`[data-element-id="${this._selectedId}"]`);
    if (target) {
      target.classList.add('selected');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  protected override _renderDocument(): void {
    const body = this._bodyRef.value;
    if (!body) {
      // Body not yet in DOM — re-render after Lit updates
      this.requestUpdate();
      this.updateComplete.then(() => this._renderDocument());
      return;
    }
    const state = this._docState;
    body.innerHTML = '';
    if (!state) return;

    const segment = state.segments[this._currentPage - 1] ?? [];
    const elementIds = assignElementIds(segment);
    state.elementIds = elementIds;
    state.idToElement = invertElementIds(elementIds);

    if (segmentHasMarkup(segment)) {
      body.appendChild(
        buildMarkupView(segment, elementIds, id =>
          this.dispatchEvent(
            new CustomEvent('doclang-element-select', {
              bubbles: true,
              composed: true,
              detail: { id },
            })
          )
        )
      );
    } else {
      body.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    }
  }

  protected override _clearDocument(): void {
    const body = this._bodyRef.value;
    if (body) body.innerHTML = '';
  }

  private _onMousemove = (e: MouseEvent): void => {
    if (!(e.target as Element).closest('.markup-ghost-tag-part')) {
      this._hideHint();
      return;
    }
    this.dispatchEvent(
      new CustomEvent('doclang-hint', {
        bubbles: true,
        composed: true,
        detail: {
          text: VIRTUAL_TEXT_TAG_HINT,
          clientX: e.clientX,
          clientY: e.clientY,
        },
      })
    );
  };

  private _onMouseleave = (): void => this._hideHint();

  private _hideHint(): void {
    this.dispatchEvent(
      new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
    );
  }
}
