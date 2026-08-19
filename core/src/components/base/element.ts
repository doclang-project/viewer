/** Base class for all doclang web components. */

export abstract class DoclangHTMLElement extends HTMLElement {
  readonly shadow: ShadowRoot;

  constructor(css: string, html: string) {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    this.shadow.adoptedStyleSheets = [sheet];
    this.shadow.innerHTML = html;
  }

  protected q<T extends Element>(selector: string): T {
    const el = this.shadow.querySelector<T>(selector);
    if (!el)
      throw new Error(
        `[${this.tagName.toLowerCase()}] No element matches "${selector}"`
      );
    return el;
  }
}
