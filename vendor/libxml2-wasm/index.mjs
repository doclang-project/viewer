/**
 * This is the main script of the library.
 *
 * After installing the library in your `node_modules` directory,
 * you can import the class and other elements like this:
 *
 * ```ts
 * import { <symbol> } from 'libxml2-wasm';
 * ```
 * @module libxml2-wasm
 */
export * as diag from './diag.mjs';
export * as disposable from './disposable.mjs';
export { XmlXPath, XmlXPathError } from './xpath.mjs';
export { XmlAttribute, XmlCData, XmlComment, XmlElement, XmlEntityReference, XmlNode, XmlSimpleNode, XmlText, XmlTreeNode, } from './nodes.mjs';
export { ParseOption, XmlDocument, XmlParseError } from './document.mjs';
export { xmlCleanupInputProvider, XmlError, XmlLibError, xmlRegisterInputProvider, } from './libxml2.mjs';
export { XmlDtd } from './dtd.mjs';
export { DtdValidator, RelaxNGValidator, XmlValidateError, XsdValidator, } from './validates.mjs';
export { closeBuffer, openBuffer, readBuffer, XmlBufferInputProvider, XmlStringOutputBufferHandler, } from './utils.mjs';
export { XmlC14NMode, } from './c14n.mjs';
//# sourceMappingURL=index.mjs.map