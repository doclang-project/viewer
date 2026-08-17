/** <doclang-markup-pane> — DocLang XML markup view */

import { DoclangHTMLElement } from '../base/base';
import styles from './markup-pane.css?inline';
import template from './markup-pane.html?raw';

export class DoclangMarkupPane extends DoclangHTMLElement {
  private _body: HTMLElement;

  constructor() {
    super(styles, template);
    this.classList.add('pane', 'pane-markup');
    this._body = this.q('.pane-body');
  }

  get section(): HTMLElement {
    return this;
  }
  get body(): HTMLElement {
    return this._body;
  }

  setVisible(visible: boolean): void {
    this.hidden = !visible;
  }

  setLastPane(isLast: boolean): void {
    this.classList.toggle('pane-layout-last', isLast);
  }
}

customElements.define('doclang-markup-pane', DoclangMarkupPane);
