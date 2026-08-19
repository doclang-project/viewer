/** <doclang-markup-pane> — DocLang XML markup view */

import { DoclangPageElement } from '../base/page-element';
import styles from './markup-pane.css?inline';
import template from './markup-pane.html?raw';
import {
  assignElementIds,
  invertElementIds,
  segmentHasMarkup,
  NO_MARKUP,
} from '../../doclang/document';
import { buildMarkupView, VIRTUAL_TEXT_TAG_HINT } from './markup';

export class DoclangMarkupPane extends DoclangPageElement {
  private _body: HTMLElement;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-markup');
    this._body = this.q('.pane-body');
    this._wireHints();
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  protected override _applySelection(): void {
    for (const el of this._body.querySelectorAll('.markup-el.selected')) {
      el.classList.remove('selected');
    }
    if (!this._selectedId) return;
    const target =
      this._body.querySelector(
        `.markup-el-virtual-text[data-element-id="${this._selectedId}"]`
      ) ?? this._body.querySelector(`[data-element-id="${this._selectedId}"]`);
    if (target) {
      target.classList.add('selected');
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  protected override _renderDocument(): void {
    const state = this._docState;
    this._body.innerHTML = '';
    if (!state) return;

    const segment = state.segments[this._currentPage - 1] ?? [];
    const elementIds = assignElementIds(segment);
    state.elementIds = elementIds;
    state.idToElement = invertElementIds(elementIds);

    if (segmentHasMarkup(segment)) {
      this._body.appendChild(
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
      this._body.innerHTML = `<div class="placeholder">${NO_MARKUP}</div>`;
    }
  }

  protected override _clearDocument(): void {
    this._body.innerHTML = '';
  }

  private _wireHints(): void {
    this.addEventListener('mousemove', e => {
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
            clientX: (e as MouseEvent).clientX,
            clientY: (e as MouseEvent).clientY,
          },
        })
      );
    });
    this.addEventListener('mouseleave', () => this._hideHint());
  }

  private _hideHint(): void {
    this.dispatchEvent(
      new CustomEvent('doclang-hint-hide', { bubbles: true, composed: true })
    );
  }
}

customElements.define('doclang-markup-pane', DoclangMarkupPane);
