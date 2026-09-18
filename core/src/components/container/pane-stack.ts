/**
 * <doclang-pane-stack> — synchronises a set of DoclangPageElement children.
 *
 * Place any number of DoclangPageElement-based panes as children (via slot).
 *
 * Example:
 *   <doclang-pane-stack src="doc.dclx" page="1">
 *     <doclang-markup-pane></doclang-markup-pane>
 *     <doclang-reading-pane></doclang-reading-pane>
 *   </doclang-pane-stack>
 */

import { html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { DoclangPageElement } from '../base/page-element';

@customElement('doclang-pane-stack')
export class DoclangPaneStack extends DoclangPageElement {

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('view-page', this._onChildViewPage as EventListener);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('view-page', this._onChildViewPage as EventListener);
  }

  override render() {
    return html`<slot></slot>`;
  }

  protected override _renderDocument(): void {
    this._pushToChildren();
  }

  protected override _clearDocument(): void {
    this._pushToChildren();
  }

  protected override _applySelection(): void {
    this._pushSelectedToChildren();
  }

  private _children(): DoclangPageElement[] {
    return Array.from(this.children).filter(
      (el): el is DoclangPageElement => el instanceof DoclangPageElement,
    );
  }

  private _pushToChildren(): void {
    for (const child of this._children()) {
      child.document = this._docState;
      child.page = this.page;
      child.selected = this.selected ?? null;
    }
  }

  private _pushSelectedToChildren(): void {
    for (const child of this._children()) {
      child.selected = this.selected ?? null;
    }
  }

  private _onChildViewPage = (e: Event): void => {
    // Only handle events from children, not from self (PageController on this
    // element would emit on self too if it were installed — it isn't, but
    // guard anyway).
    if (e.target === this) return;
    const requested = (e as CustomEvent<{ page: number }>).detail.page;
    // Stop the event here — pane-stack owns page navigation for its subtree.
    e.stopPropagation();
    this.page = requested;
    // page setter → updated() → _renderDocument() → _pushToChildren()
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'doclang-pane-stack': DoclangPaneStack;
  }
}
