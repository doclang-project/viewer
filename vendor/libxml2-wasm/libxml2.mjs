import moduleLoader from './libxml2raw.mjs';
import { ContextStorage } from './utils.mjs';
const libxml2 = await moduleLoader();
/* c8 ignore next 2, the branch will be hit only on Windows */
if (typeof process !== 'undefined' && process.platform === 'win32') {
    libxml2._xmlSetWinPathEnabled(1);
}
else {
    libxml2._xmlSetWinPathEnabled(0);
}
libxml2._xmlInitParser();
/**
 * Export runtime functions needed by other modules.
 * @internal
 */
export const { addFunction } = libxml2;
/**
 * The base class for exceptions in this library.
 *
 * All exceptions thrown in this library will be instances of this class or its subclasses.
 */
export class XmlError extends Error {
}
/**
 * An exception class represents the error in libxml2.
 */
export class XmlLibError extends XmlError {
    constructor(message, details) {
        super(message);
        this.details = details;
    }
}
function allocUTF8Buffer(str) {
    if (!str) {
        return [0, 0];
    }
    const len = libxml2.lengthBytesUTF8(str);
    const buf = libxml2._malloc(len + 1);
    libxml2.stringToUTF8(str, buf, len + 1);
    return [buf, len];
}
function withStrings(process, ...strings) {
    const args = strings.map((str) => {
        const [buf] = allocUTF8Buffer(str);
        return buf;
    });
    const ret = process(...args);
    args.forEach((buf) => {
        if (buf) {
            libxml2._free(buf);
        }
    });
    return ret;
}
function withStringUTF8(str, process) {
    const [buf, len] = allocUTF8Buffer(str);
    const ret = process(buf, len);
    if (buf) {
        libxml2._free(buf);
    }
    return ret;
}
function moveUtf8ToString(cstr) {
    const str = libxml2.UTF8ToString(cstr);
    libxml2._free(cstr);
    return str;
}
function withCString(str, process) {
    if (!str) {
        return process(0, 0);
    }
    const buf = libxml2._malloc(str.length + 1);
    libxml2.HEAPU8.set(str, buf);
    libxml2.HEAPU8[buf + str.length] = 0;
    const ret = process(buf, str.length);
    libxml2._free(buf);
    return ret;
}
export function xmlReadString(ctxt, xmlString, url, encoding, options) {
    return withStringUTF8(xmlString, (xmlBuf, len) => withStrings((urlBuf, enc) => libxml2._xmlCtxtReadMemory(ctxt, xmlBuf, len, urlBuf, enc, options), url, encoding));
}
export function xmlReadMemory(ctxt, xmlBuffer, url, encoding, options) {
    return withCString(xmlBuffer, (xmlBuf, len) => withStrings((urlBuf, enc) => libxml2._xmlCtxtReadMemory(ctxt, xmlBuf, len, urlBuf, enc, options), url, encoding));
}
export function xmlXPathRegisterNs(ctx, prefix, uri) {
    return withStrings((bufPrefix, bufUri) => libxml2._xmlXPathRegisterNs(ctx, bufPrefix, bufUri), prefix, uri);
}
export function xmlHasNsProp(node, name, namespace) {
    return withStrings((bufName, bufNamespace) => libxml2._xmlHasNsProp(node, bufName, bufNamespace), name, namespace);
}
export function xmlSetNsProp(node, namespace, name, value) {
    return withStrings((bufName, bufValue) => libxml2._xmlSetNsProp(node, namespace, bufName, bufValue), name, value);
}
export function xmlNodeGetContent(node) {
    return moveUtf8ToString(libxml2._xmlNodeGetContent(node));
}
export function xmlGetNodePath(node) {
    if (node === 0) {
        return null;
    }
    const path = libxml2._xmlGetNodePath(node);
    /* c8 ignore next 3, defensive code, only hit if libxml2 fails to allocate the path */
    if (path === 0) {
        return null;
    }
    return moveUtf8ToString(path);
}
export function xmlNodeSetContent(node, content) {
    return withStringUTF8(content, (buf, len) => libxml2._xmlNodeSetContentLen(node, buf, len));
}
function getValueFunc(offset, type) {
    return (ptr) => {
        if (ptr === 0) {
            throw new XmlError('Access with null pointer');
        }
        return libxml2.getValue(ptr + offset, type);
    };
}
function nullableUTF8ToString(str) {
    if (str === 0) {
        return null;
    }
    return libxml2.UTF8ToString(str);
}
function getNullableStringValueFunc(offset) {
    return (ptr) => nullableUTF8ToString(libxml2.getValue(ptr + offset, 'i8*'));
}
function getStringValueFunc(offset) {
    return (ptr) => {
        if (ptr === 0) {
            throw new XmlError('Access with null pointer');
        }
        return libxml2.UTF8ToString(libxml2.getValue(ptr + offset, 'i8*'));
    };
}
export function xmlGetNsList(doc, node) {
    const nsList = libxml2._xmlGetNsList(doc, node);
    if (nsList === 0) {
        return [];
    }
    const arr = [];
    for (let offset = nsList / libxml2.HEAP32.BYTES_PER_ELEMENT; libxml2.HEAP32[offset]; offset += 1) {
        arr.push(libxml2.HEAP32[offset]);
    }
    libxml2._free(nsList);
    return arr;
}
export function xmlSearchNs(doc, node, prefix) {
    return withStrings((buf) => libxml2._xmlSearchNs(doc, node, buf), prefix);
}
export function xmlXPathCtxtCompile(ctxt, str) {
    return withStrings((buf) => libxml2._xmlXPathCtxtCompile(ctxt, buf), str);
}
export const error = {
    storage: new ContextStorage(),
    errorCollector: libxml2.addFunction((index, err) => {
        const file = XmlErrorStruct.file(err);
        const detail = {
            message: XmlErrorStruct.message(err),
            level: XmlErrorStruct.level(err),
            line: XmlErrorStruct.line(err),
            col: XmlErrorStruct.col(err),
        };
        if (file != null) {
            detail.file = file;
        }
        const node = XmlErrorStruct.node(err);
        const xpath = xmlGetNodePath(node);
        if (xpath != null) {
            detail.xpath = xpath;
        }
        error.storage.get(index).push(detail);
    }, 'vii'),
};
export class XmlXPathObjectStruct {
}
XmlXPathObjectStruct.type = getValueFunc(0, 'i32');
XmlXPathObjectStruct.nodesetval = getValueFunc(4, '*');
XmlXPathObjectStruct.boolval = getValueFunc(8, 'i32');
XmlXPathObjectStruct.floatval = getValueFunc(16, 'double'); // 8 bytes padding
XmlXPathObjectStruct.stringval = getStringValueFunc(24);
XmlXPathObjectStruct.Type = {
    XPATH_NODESET: 1,
    XPATH_BOOLEAN: 2,
    XPATH_NUMBER: 3,
    XPATH_STRING: 4,
};
export class XmlNodeSetStruct {
    static nodeTable(nodeSetPtr, size) {
        // pointer to a pointer array, return the pointer array
        const tablePtr = libxml2.getValue(nodeSetPtr + 8, '*') / libxml2.HEAP32.BYTES_PER_ELEMENT;
        return libxml2.HEAP32.subarray(tablePtr, tablePtr + size);
    }
}
XmlNodeSetStruct.nodeCount = getValueFunc(0, 'i32');
export class XmlTreeCommonStruct {
}
XmlTreeCommonStruct.type = getValueFunc(4, 'i32');
XmlTreeCommonStruct.name_ = getStringValueFunc(8);
XmlTreeCommonStruct.children = getValueFunc(12, '*');
XmlTreeCommonStruct.last = getValueFunc(16, '*');
XmlTreeCommonStruct.parent = getValueFunc(20, '*');
XmlTreeCommonStruct.next = getValueFunc(24, '*');
XmlTreeCommonStruct.prev = getValueFunc(28, '*');
XmlTreeCommonStruct.doc = getValueFunc(32, '*');
export class XmlNamedNodeStruct extends XmlTreeCommonStruct {
}
XmlNamedNodeStruct.namespace = getValueFunc(36, '*');
export class XmlNodeStruct extends XmlNamedNodeStruct {
}
XmlNodeStruct.properties = getValueFunc(44, '*');
XmlNodeStruct.nsDef = getValueFunc(48, '*');
XmlNodeStruct.line = getValueFunc(56, 'i32');
export var XmlNodeType;
(function (XmlNodeType) {
    XmlNodeType[XmlNodeType["XML_ELEMENT_NODE"] = 1] = "XML_ELEMENT_NODE";
    XmlNodeType[XmlNodeType["XML_ATTRIBUTE_NODE"] = 2] = "XML_ATTRIBUTE_NODE";
    XmlNodeType[XmlNodeType["XML_TEXT_NODE"] = 3] = "XML_TEXT_NODE";
    XmlNodeType[XmlNodeType["XML_CDATA_SECTION_NODE"] = 4] = "XML_CDATA_SECTION_NODE";
    XmlNodeType[XmlNodeType["XML_ENTITY_REF_NODE"] = 5] = "XML_ENTITY_REF_NODE";
    XmlNodeType[XmlNodeType["XML_PI_NODE"] = 7] = "XML_PI_NODE";
    XmlNodeType[XmlNodeType["XML_COMMENT_NODE"] = 8] = "XML_COMMENT_NODE";
    XmlNodeType[XmlNodeType["XML_DOCUMENT_NODE"] = 9] = "XML_DOCUMENT_NODE";
    XmlNodeType[XmlNodeType["XML_DTD_NODE"] = 14] = "XML_DTD_NODE";
    XmlNodeType[XmlNodeType["XML_ELEMENT_DECL"] = 15] = "XML_ELEMENT_DECL";
    XmlNodeType[XmlNodeType["XML_ATTRIBUTE_DECL"] = 16] = "XML_ATTRIBUTE_DECL";
    XmlNodeType[XmlNodeType["XML_ENTITY_DECL"] = 17] = "XML_ENTITY_DECL";
    XmlNodeType[XmlNodeType["XML_NAMESPACE_DECL"] = 18] = "XML_NAMESPACE_DECL";
})(XmlNodeType || (XmlNodeType = {}));
export class XmlNsStruct {
}
XmlNsStruct.next = getValueFunc(0, '*');
XmlNsStruct.href = getStringValueFunc(8);
XmlNsStruct.prefix = getStringValueFunc(12);
export class XmlAttrStruct extends XmlTreeCommonStruct {
}
export class XmlErrorStruct {
    static node(err) {
        if (err === 0) {
            return 0;
        }
        return libxml2.getValue(err + 48, '*');
    }
}
XmlErrorStruct.message = getStringValueFunc(8);
XmlErrorStruct.level = getValueFunc(12, 'i32');
XmlErrorStruct.file = getNullableStringValueFunc(16);
XmlErrorStruct.line = getValueFunc(20, 'i32');
XmlErrorStruct.col = getValueFunc(40, 'i32');
export class XmlDocStruct {
}
XmlDocStruct.standalone = getValueFunc(40, 'i32');
XmlDocStruct.version = getStringValueFunc(56);
XmlDocStruct.encoding = getNullableStringValueFunc(60);
export function xmlNewCDataBlock(doc, content) {
    return withStringUTF8(content, (buf, len) => libxml2._xmlNewCDataBlock(doc, buf, len));
}
export function xmlNewDocComment(doc, content) {
    return withStringUTF8(content, (buf) => libxml2._xmlNewDocComment(doc, buf));
}
export function xmlNewDocNode(doc, ns, name) {
    return withStrings((buf) => libxml2._xmlNewDocNode(doc, ns, buf, 0), name);
}
export function xmlNewDocText(doc, content) {
    return withStringUTF8(content, (buf, len) => libxml2._xmlNewDocTextLen(doc, buf, len));
}
export function xmlNewNs(node, href, prefix) {
    return withStrings((bufHref, bufPrefix) => libxml2._xmlNewNs(node, bufHref, bufPrefix), href, prefix ?? null);
}
export function xmlNewReference(doc, name) {
    return withStringUTF8(name, (buf) => libxml2._xmlNewReference(doc, buf));
}
// Function-table entries of the registered callbacks. addFunction never reuses an entry
// until it is removed, so they are tracked here and released by xmlCleanupInputProvider.
const inputCallbackFuncs = [];
/**
 * Register the callbacks from the provider to the system.
 *
 * @param provider Provider of callbacks to be registered.
 * @alpha
 */
export function xmlRegisterInputProvider(provider) {
    const matchFunc = libxml2.addFunction((cfilename) => {
        const filename = libxml2.UTF8ToString(cfilename);
        return provider.match(filename) ? 1 : 0;
    }, 'ii');
    const openFunc = libxml2.addFunction((cfilename) => {
        const filename = libxml2.UTF8ToString(cfilename);
        const res = provider.open(filename);
        return res ?? 0;
    }, 'ii');
    const readFunc = libxml2.addFunction((fd, cbuf, len) => provider.read(fd, libxml2.HEAPU8.subarray(cbuf, cbuf + len)), 'iiii');
    const closeFunc = libxml2.addFunction((fd) => (provider.close(fd) ? 0 : -1), 'ii');
    const funcs = [matchFunc, openFunc, readFunc, closeFunc];
    const res = libxml2._xmlRegisterInputCallbacks(matchFunc, openFunc, readFunc, closeFunc);
    if (res < 0) {
        // libxml2 didn't take the callbacks, its callback table is full.
        funcs.forEach((func) => libxml2.removeFunction(func));
        return false;
    }
    inputCallbackFuncs.push(...funcs);
    return true;
}
/**
 * Remove and cleanup all registered input providers.
 *
 * This releases the wasm function-table entries of the registered callbacks, so it must
 * not be called from a provider callback: libxml2 keeps calling the read and close
 * callbacks of the files it still has open.
 * @alpha
 */
export function xmlCleanupInputProvider() {
    libxml2._xmlCleanupInputCallbacks();
    inputCallbackFuncs.forEach((func) => libxml2.removeFunction(func));
    inputCallbackFuncs.length = 0;
}
export function xmlSaveOption(options) {
    if (!options) {
        return 1; // default is to format with default setting
    }
    let flags = 0;
    if (options.format) {
        flags |= 1 << 0;
    }
    if (options.noDeclaration) {
        flags |= 1 << 1;
    }
    if (options.noEmptyTags) {
        flags |= 1 << 2;
    }
    return flags;
}
const outputHandlerStorage = new ContextStorage();
const outputWrite = libxml2.addFunction((index, buf, len) => outputHandlerStorage.get(index)
    .write(libxml2.HEAPU8.subarray(buf, buf + len)), 'iiii');
const outputClose = libxml2.addFunction((index) => {
    const ret = outputHandlerStorage.get(index).close();
    outputHandlerStorage.free(index);
    return ret;
}, 'ii');
/**
 * Register an output handler and run the FFI creator with its storage index.
 * On success the slot is freed later via {@link outputClose}; when the creator
 * returns a null pointer libxml2 never invokes the close callback, so free here.
 */
function withOutputHandler(handler, create) {
    const index = outputHandlerStorage.allocate(handler);
    const ptr = create(index);
    if (ptr === 0) {
        outputHandlerStorage.free(index);
    }
    return ptr;
}
export function xmlSaveToIO(handler, encoding, format) {
    const ctxt = withOutputHandler(handler, (index) => withStringUTF8(encoding, (encBuf) => libxml2._xmlSaveToIO(outputWrite, outputClose, index, encBuf, format)));
    if (ctxt === 0) {
        throw new XmlError(`Unsupported save encoding "${encoding ?? 'utf-8'}"`);
    }
    return ctxt;
}
var XmlParserInputFlags;
(function (XmlParserInputFlags) {
    XmlParserInputFlags[XmlParserInputFlags["XML_INPUT_BUF_STATIC"] = 2] = "XML_INPUT_BUF_STATIC";
    XmlParserInputFlags[XmlParserInputFlags["XML_INPUT_BUF_ZERO_TERMINATED"] = 4] = "XML_INPUT_BUF_ZERO_TERMINATED";
    XmlParserInputFlags[XmlParserInputFlags["XML_INPUT_UNZIP"] = 8] = "XML_INPUT_UNZIP";
    XmlParserInputFlags[XmlParserInputFlags["XML_INPUT_NETWORK"] = 16] = "XML_INPUT_NETWORK";
})(XmlParserInputFlags || (XmlParserInputFlags = {}));
export function xmlCtxtParseDtd(ctxt, mem, publicId, systemId) {
    return withCString(mem, (buf, len) => {
        const input = libxml2._xmlNewInputFromMemory(0, buf, len, XmlParserInputFlags.XML_INPUT_BUF_STATIC
            | XmlParserInputFlags.XML_INPUT_BUF_ZERO_TERMINATED);
        return withStrings((publicIdBuf, systemIdBuf) => libxml2._xmlCtxtParseDtd(ctxt, input, publicIdBuf, systemIdBuf), publicId, systemId);
    });
}
export function xmlSaveSetIndentString(ctxt, indent) {
    return withStringUTF8(indent, (buf) => libxml2._xmlSaveSetIndentString(ctxt, buf));
}
/**
 * Helper to create a C-style NULL-terminated array of C strings.
 *
 * Allocates a single contiguous memory block containing:
 * - First: the pointer array (n+1 pointers, last is NULL)
 * - Then: the string data (all strings with null terminators)
 *
 * Memory layout: [ptr0][ptr1]...[ptrN][NULL][str0\0][str1\0]...[strN\0]
 *
 * @returns The pointer to the allocated memory. Caller must free with {@link free}.
 */
export function allocCStringArray(strings) {
    // Calculate total size needed
    const pointerArraySize = (strings.length + 1) * 4; // +1 for NULL terminator
    const stringSizes = strings.map((s) => libxml2.lengthBytesUTF8(s) + 1);
    const totalStringSize = stringSizes.reduce((sum, size) => sum + size, 0);
    const totalSize = pointerArraySize + totalStringSize;
    // Allocate single block
    const ptr = libxml2._malloc(totalSize);
    // Write strings and set pointers
    let stringOffset = ptr + pointerArraySize;
    const ptrArrayBase = ptr / libxml2.HEAP32.BYTES_PER_ELEMENT;
    strings.forEach((s, i) => {
        // Set pointer to this string
        libxml2.HEAP32[ptrArrayBase + i] = stringOffset;
        // Write the string
        libxml2.stringToUTF8(s, stringOffset, stringSizes[i]);
        stringOffset += stringSizes[i];
    });
    // NULL terminate the pointer array
    libxml2.HEAP32[ptrArrayBase + strings.length] = 0;
    return ptr;
}
export const free = libxml2._free;
export const xmlAddChild = libxml2._xmlAddChild;
export const xmlAddNextSibling = libxml2._xmlAddNextSibling;
export const xmlAddPrevSibling = libxml2._xmlAddPrevSibling;
export const xmlCtxtSetErrorHandler = libxml2._xmlCtxtSetErrorHandler;
export const xmlCtxtValidateDtd = libxml2._xmlCtxtValidateDtd;
export const xmlDocGetRootElement = libxml2._xmlDocGetRootElement;
export const xmlDocSetRootElement = libxml2._xmlDocSetRootElement;
export const xmlFreeDoc = libxml2._xmlFreeDoc;
export const xmlFreeNode = libxml2._xmlFreeNode;
export const xmlFreeDtd = libxml2._xmlFreeDtd;
export const xmlFreeParserCtxt = libxml2._xmlFreeParserCtxt;
export const xmlGetIntSubset = libxml2._xmlGetIntSubset;
export const xmlGetLastError = libxml2._xmlGetLastError;
export const xmlNewDoc = libxml2._xmlNewDoc;
export const xmlNewParserCtxt = libxml2._xmlNewParserCtxt;
export const xmlRelaxNGFree = libxml2._xmlRelaxNGFree;
export const xmlRelaxNGFreeParserCtxt = libxml2._xmlRelaxNGFreeParserCtxt;
export const xmlRelaxNGFreeValidCtxt = libxml2._xmlRelaxNGFreeValidCtxt;
export const xmlRelaxNGNewDocParserCtxt = libxml2._xmlRelaxNGNewDocParserCtxt;
export const xmlRelaxNGNewValidCtxt = libxml2._xmlRelaxNGNewValidCtxt;
export const xmlRelaxNGParse = libxml2._xmlRelaxNGParse;
export const xmlRelaxNGSetParserStructuredErrors = libxml2._xmlRelaxNGSetParserStructuredErrors;
export const xmlRelaxNGSetValidStructuredErrors = libxml2._xmlRelaxNGSetValidStructuredErrors;
export const xmlRelaxNGValidateDoc = libxml2._xmlRelaxNGValidateDoc;
export const xmlRemoveProp = libxml2._xmlRemoveProp;
export const xmlResetLastError = libxml2._xmlResetLastError;
export const xmlSaveClose = libxml2._xmlSaveClose;
export const xmlSaveDoc = libxml2._xmlSaveDoc;
export const xmlSaveTree = libxml2._xmlSaveTree;
export const xmlSchemaFree = libxml2._xmlSchemaFree;
export const xmlSchemaFreeParserCtxt = libxml2._xmlSchemaFreeParserCtxt;
export const xmlSchemaFreeValidCtxt = libxml2._xmlSchemaFreeValidCtxt;
export const xmlSchemaNewDocParserCtxt = libxml2._xmlSchemaNewDocParserCtxt;
export const xmlSchemaNewValidCtxt = libxml2._xmlSchemaNewValidCtxt;
export const xmlSchemaParse = libxml2._xmlSchemaParse;
export const xmlSchemaSetParserStructuredErrors = libxml2._xmlSchemaSetParserStructuredErrors;
export const xmlSchemaSetValidStructuredErrors = libxml2._xmlSchemaSetValidStructuredErrors;
export const xmlSchemaValidateDoc = libxml2._xmlSchemaValidateDoc;
export const xmlSchemaValidateOneElement = libxml2._xmlSchemaValidateOneElement;
export const xmlSetNs = libxml2._xmlSetNs;
export const xmlUnlinkNode = libxml2._xmlUnlinkNode;
export const xmlXIncludeFreeContext = libxml2._xmlXIncludeFreeContext;
export const xmlXIncludeNewContext = libxml2._xmlXIncludeNewContext;
export const xmlXIncludeProcessNode = libxml2._xmlXIncludeProcessNode;
export const xmlXIncludeSetErrorHandler = libxml2._xmlXIncludeSetErrorHandler;
export const xmlXPathCompiledEval = libxml2._xmlXPathCompiledEval;
export const xmlXPathFreeCompExpr = libxml2._xmlXPathFreeCompExpr;
export const xmlXPathFreeContext = libxml2._xmlXPathFreeContext;
export const xmlXPathFreeObject = libxml2._xmlXPathFreeObject;
export const xmlXPathNewContext = libxml2._xmlXPathNewContext;
export const xmlXPathSetContextNode = libxml2._xmlXPathSetContextNode;
/**
 * Create an output buffer using I/O callbacks (same pattern as xmlSaveToIO)
 * @internal
 */
export function xmlOutputBufferCreateIO(handler) {
    return withOutputHandler(handler, (index) => libxml2._xmlOutputBufferCreateIO(outputWrite, outputClose, index, 0));
}
export const xmlOutputBufferClose = libxml2._xmlOutputBufferClose;
export const xmlC14NExecute = libxml2._xmlC14NExecute;
//# sourceMappingURL=libxml2.mjs.map