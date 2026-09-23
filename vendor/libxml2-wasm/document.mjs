var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
import { canonicalizeDocument } from './c14n.mjs';
import { disposeBy, XmlDisposable } from './disposable.mjs';
import { XmlDtd } from './dtd.mjs';
import { error, xmlCtxtSetErrorHandler, xmlDocGetRootElement, xmlDocSetRootElement, XmlDocStruct, XmlError, xmlFreeDoc, xmlFreeNode, xmlFreeParserCtxt, xmlGetIntSubset, XmlLibError, xmlNewDoc, xmlNewDocNode, xmlNewParserCtxt, xmlReadMemory, xmlReadString, xmlSaveClose, xmlSaveDoc, xmlSaveOption, xmlSaveSetIndentString, xmlSaveToIO, xmlXIncludeFreeContext, xmlXIncludeNewContext, xmlXIncludeProcessNode, xmlXIncludeSetErrorHandler, } from './libxml2.mjs';
import { XmlElement } from './nodes.mjs';
import { XmlStringOutputBufferHandler } from './utils.mjs';
export var ParseOption;
(function (ParseOption) {
    ParseOption[ParseOption["XML_PARSE_DEFAULT"] = 0] = "XML_PARSE_DEFAULT";
    /**
     * Enable "recovery" mode which allows non-wellformed documents.
     * How this mode behaves exactly is unspecified and may change without further notice.
     * Use of this feature is DISCOURAGED.
     *
     * Not supported by the push parser.
     */
    ParseOption[ParseOption["XML_PARSE_RECOVER"] = 1] = "XML_PARSE_RECOVER";
    /**
     * Despite the confusing name, this option enables substitution of entities.
     * The resulting tree won't contain any entity reference nodes.
     *
     * This option also enables loading of external entities (both general and parameter entities)
     * which is dangerous. If you process untrusted data, it's recommended to set the
     * XML_PARSE_NO_XXE option to disable loading of external entities.
     */
    ParseOption[ParseOption["XML_PARSE_NOENT"] = 2] = "XML_PARSE_NOENT";
    /**
     * Enables loading of an external DTD and the loading and substitution of external
     * parameter entities. Has no effect if XML_PARSE_NO_XXE is set.
     */
    ParseOption[ParseOption["XML_PARSE_DTDLOAD"] = 4] = "XML_PARSE_DTDLOAD";
    /**
     * Adds default attributes from the DTD to the result document.
     *
     * Implies XML_PARSE_DTDLOAD, but loading of external content
     * can be disabled with XML_PARSE_NO_XXE.
     */
    ParseOption[ParseOption["XML_PARSE_DTDATTR"] = 8] = "XML_PARSE_DTDATTR";
    /**
     * Enable DTD validation which requires loading external DTDs and external entities
     * (both general and parameter entities) unless XML_PARSE_NO_XXE was set.
     *
     * DTD validation is vulnerable to algorithmic complexity attacks and should never be
     * enabled with untrusted input.
     */
    ParseOption[ParseOption["XML_PARSE_DTDVALID"] = 16] = "XML_PARSE_DTDVALID";
    /**
     * Disable error and warning reports to the error handlers.
     * Errors are still accessible with xmlCtxtGetLastError().
     */
    ParseOption[ParseOption["XML_PARSE_NOERROR"] = 32] = "XML_PARSE_NOERROR";
    /** Disable warning reports. */
    ParseOption[ParseOption["XML_PARSE_NOWARNING"] = 64] = "XML_PARSE_NOWARNING";
    /** Enable some pedantic warnings. */
    ParseOption[ParseOption["XML_PARSE_PEDANTIC"] = 128] = "XML_PARSE_PEDANTIC";
    /**
     * Remove some whitespace from the result document. Where to remove whitespace depends on
     * DTD element declarations or a broken heuristic with unfixable bugs. Use of this option is
     * DISCOURAGED.
     *
     * Not supported by the push parser.
     */
    ParseOption[ParseOption["XML_PARSE_NOBLANKS"] = 256] = "XML_PARSE_NOBLANKS";
    /**
     * Always invoke the deprecated SAX1 startElement and endElement handlers.
     *
     * @deprecated This option will be removed in a future version.
     */
    ParseOption[ParseOption["XML_PARSE_SAX1"] = 512] = "XML_PARSE_SAX1";
    /**
     * Enable XInclude processing. This option only affects the xmlTextReader
     * and XInclude interfaces.
     */
    ParseOption[ParseOption["XML_PARSE_XINCLUDE"] = 1024] = "XML_PARSE_XINCLUDE";
    /**
     * Disable network access with the built-in HTTP or FTP clients.
     * After the last built-in network client was removed in 2.15, this option has no effect
     * except for being passed on to custom resource loaders.
     */
    ParseOption[ParseOption["XML_PARSE_NONET"] = 2048] = "XML_PARSE_NONET";
    /**
     * Create a document without interned strings, making all strings separate memory allocations.
     */
    ParseOption[ParseOption["XML_PARSE_NODICT"] = 4096] = "XML_PARSE_NODICT";
    /** Remove redundant namespace declarations from the result document. */
    ParseOption[ParseOption["XML_PARSE_NSCLEAN"] = 8192] = "XML_PARSE_NSCLEAN";
    /** Output normal text nodes instead of CDATA nodes. */
    ParseOption[ParseOption["XML_PARSE_NOCDATA"] = 16384] = "XML_PARSE_NOCDATA";
    /**
     * Don't generate XInclude start/end nodes when expanding inclusions.
     * This option only affects the xmlTextReader and XInclude interfaces.
     */
    ParseOption[ParseOption["XML_PARSE_NOXINCNODE"] = 32768] = "XML_PARSE_NOXINCNODE";
    /**
     * Store small strings directly in the node struct to save memory.
     */
    ParseOption[ParseOption["XML_PARSE_COMPACT"] = 65536] = "XML_PARSE_COMPACT";
    /**
     * Use old Name productions from before XML 1.0 Fifth Edition.
     *
     * @deprecated This option will be removed in a future version.
     */
    ParseOption[ParseOption["XML_PARSE_OLD10"] = 131072] = "XML_PARSE_OLD10";
    /**
     * Don't fix up XInclude xml:base URIs. This option only affects the xmlTextReader
     * and XInclude interfaces.
     */
    ParseOption[ParseOption["XML_PARSE_NOBASEFIX"] = 262144] = "XML_PARSE_NOBASEFIX";
    /**
     * Relax some internal limits.
     *
     * Maximum size of text nodes, tags, comments, processing instructions,
     * CDATA sections, entity values
     *
     *  - normal: 10M
     *  - huge:    1B
     *
     * Maximum size of names, system literals, pubid literals
     *
     *  - normal: 50K
     *  - huge:   10M
     *
     * Maximum nesting depth of elements
     *
     *  - normal:  256
     *  - huge:   2048
     *
     * Maximum nesting depth of entities
     *
     *  - normal: 20
     *  - huge:   40
     */
    ParseOption[ParseOption["XML_PARSE_HUGE"] = 524288] = "XML_PARSE_HUGE";
    /**
     * Enable an unspecified legacy mode for SAX parsers.
     *
     * @deprecated This option will be removed in a future version.
     */
    ParseOption[ParseOption["XML_PARSE_OLDSAX"] = 1048576] = "XML_PARSE_OLDSAX";
    /**
     * Ignore the encoding in the XML declaration. Mostly unneeded these days.
     * The only effect is to enforce UTF-8 decoding of ASCII-like data.
     */
    ParseOption[ParseOption["XML_PARSE_IGNORE_ENC"] = 2097152] = "XML_PARSE_IGNORE_ENC";
    /** Enable reporting of line numbers larger than 65535. */
    ParseOption[ParseOption["XML_PARSE_BIG_LINES"] = 4194304] = "XML_PARSE_BIG_LINES";
    /**
     * Disable loading of external DTDs or entities.
     */
    ParseOption[ParseOption["XML_PARSE_NO_XXE"] = 8388608] = "XML_PARSE_NO_XXE";
    /**
     * Enable input decompression. Setting this option is discouraged to avoid zip bombs.
     */
    ParseOption[ParseOption["XML_PARSE_UNZIP"] = 16777216] = "XML_PARSE_UNZIP";
    /**
     * Disable the global system XML catalog.
     */
    ParseOption[ParseOption["XML_PARSE_NO_SYS_CATALOG"] = 33554432] = "XML_PARSE_NO_SYS_CATALOG";
    /**
     * Enable XML catalog processing instructions.
     */
    ParseOption[ParseOption["XML_PARSE_CATALOG_PI"] = 67108864] = "XML_PARSE_CATALOG_PI";
    /**
     * Force the parser to ignore IDs.
     */
    ParseOption[ParseOption["XML_PARSE_SKIP_IDS"] = 134217728] = "XML_PARSE_SKIP_IDS";
})(ParseOption || (ParseOption = {}));
export class XmlParseError extends XmlLibError {
}
/** libxml2 xmlErrorLevel: diagnostics at this severity or above are failures. */
const XML_ERR_ERROR = 2;
function parse(parser, source, url, options) {
    const xmlOptions = options.option ?? ParseOption.XML_PARSE_DEFAULT;
    const ctxt = xmlNewParserCtxt();
    const errIndex = error.storage.allocate([]);
    xmlCtxtSetErrorHandler(ctxt, error.errorCollector, errIndex);
    const xml = parser(ctxt, source, url, options.encoding ?? null, xmlOptions);
    let warnings = [];
    try {
        const errDetails = error.storage.get(errIndex);
        // Warnings (level 1) are non-fatal: libxml2 still returns a valid document.
        // Only error/fatal diagnostics, or a null result, count as a parse failure.
        const fatal = errDetails.some((d) => d.level >= XML_ERR_ERROR);
        if (fatal || !xml) {
            if (xml) {
                // A document was produced (e.g. XML_PARSE_RECOVER) but is being
                // discarded; free it here since no wrapper/finalizer will own it.
                xmlFreeDoc(xml);
            }
            throw new XmlParseError(errDetails.length > 0
                ? errDetails.map((d) => d.message).join('')
                : 'Failed to parse XML', // no diagnostics, usually invalid input
            errDetails);
        }
        // Every diagnostic here is non-fatal (a warning); surface it on the document
        // before the storage slot is freed below.
        warnings = errDetails;
    }
    finally {
        error.storage.free(errIndex);
        xmlFreeParserCtxt(ctxt);
    }
    const xmlDocument = XmlDocument.getInstance(xml);
    xmlDocument.warnings.push(...warnings);
    if (xmlOptions & ParseOption.XML_PARSE_XINCLUDE) {
        xmlDocument.processXInclude();
    }
    return xmlDocument;
}
function freeDocument(ptr) {
    // If there is a DTD, check if there is a wrapper
    // If yes, dispose it to unregister the wrapper
    const dtd = xmlGetIntSubset(ptr);
    if (dtd) {
        XmlDtd.peekInstance(dtd)?.dispose();
    }
    xmlFreeDoc(ptr);
}
/**
 * The XML document.
 */
let XmlDocument = (() => {
    let _classDecorators = [disposeBy(freeDocument)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlDisposable;
    var XmlDocument = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            /**
             * Non-fatal diagnostics (warning-level, {@link ErrorDetail.level} === 1) emitted by
             * libxml2 while parsing this document. Empty for documents created via {@link create}
             * or parsed without any warnings. Fatal diagnostics are thrown as {@link XmlParseError}.
             */
            this.warnings = [];
        }
        /** Create a new document from scratch.
         * To parse an existing xml, use {@link fromBuffer} or {@link fromString}.
         */
        static create() {
            return XmlDocument.getInstance(xmlNewDoc());
        }
        /**
         * Parse and create an {@link XmlDocument} from an XML string.
         *
         * Note: Only UTF-8 encoding is supported for string input.
         * For other encodings, use {@link fromBuffer} instead.
         *
         * @param source The XML string
         * @param options Parsing options
         * @throws Error when encoding is not 'utf-8'
         */
        static fromString(source, options = {}) {
            if (options.encoding && options.encoding !== 'utf-8') {
                throw new XmlError('Non-UTF-8 encoding is not supported for string input, use fromBuffer instead');
            }
            return parse(xmlReadString, source, options.url ?? null, options);
        }
        /**
         * Parse and create an {@link XmlDocument} from an XML buffer.
         * @param source The XML buffer
         * @param options Parsing options
         */
        static fromBuffer(source, options = {}) {
            return parse(xmlReadMemory, source, options.url ?? null, options);
        }
        /**
         * The standalone status of the document (indicator about external refs).
         *
         * 1 if standalone="yes",
         * 0 if standalone="no",
         * -1 if there is no XML declaration,
         * -2 if there is an XML declaration, but no standalone attribute was specified
         */
        get standalone() {
            return XmlDocStruct.standalone(this._ptr);
        }
        /**
         * The version string of the XML declaration.
         */
        get version() {
            return XmlDocStruct.version(this._ptr);
        }
        /**
         * The actual encoding of the document, or null if not specified.
         */
        get encoding() {
            return XmlDocStruct.encoding(this._ptr);
        }
        /**
         * Save the XmlDocument to a string
         *
         * By default, it outputs utf-8 encoded bytes,
         * while `ascii` is another allowed option for `options.encoding`,
         * which converts non-ascii characters into numeric character references.
         *
         * @param options options to adjust the saving behavior
         * @see {@link save}
         * @see {@link XmlElement#toString}
         */
        toString(options) {
            const saveOptions = options ?? { format: true };
            if (saveOptions.encoding && saveOptions.encoding !== 'utf-8'
                && saveOptions.encoding !== 'ascii') {
                throw new XmlError('Only utf-8 or ascii is supported in toString(). For other encodings, use save().');
            }
            const handler = new XmlStringOutputBufferHandler();
            this.save(handler, { encoding: 'utf-8', ...saveOptions });
            return handler.result;
        }
        /**
         * Save the XmlDocument to a buffer and invoke the callbacks to process.
         *
         * @deprecated Use `save` instead.
         */
        toBuffer(handler, options) {
            this.save(handler, options);
        }
        /**
         * Save the XmlDocument to a buffer and invoke the callbacks to process.
         *
         * By default, it outputs with original encoding.
         *
         * @param handler handlers to process the content in the buffer
         * @param options options to adjust the saving behavior
         * @see {@link toString}
         * @see {@link XmlElement#save}
         */
        save(handler, options) {
            const ctxt = xmlSaveToIO(handler, options?.encoding ?? null, xmlSaveOption(options));
            if (options?.indentString) {
                if (xmlSaveSetIndentString(ctxt, options.indentString) < 0) {
                    throw new XmlError('Failed to set indent string');
                }
            }
            xmlSaveDoc(ctxt, this._ptr);
            xmlSaveClose(ctxt);
        }
        get(xpath, namespaces) {
            return this.root.get(xpath, namespaces);
        }
        find(xpath, namespaces) {
            return this.root.find(xpath, namespaces);
        }
        eval(xpath, namespaces) {
            return this.root.eval(xpath, namespaces);
        }
        /**
         * Get the DTD of the document.
         * @returns The DTD of the document, or null if the document has no DTD.
         */
        get dtd() {
            const dtd = xmlGetIntSubset(this._ptr);
            return dtd ? XmlDtd.getInstance(dtd) : null;
        }
        /**
         * The root element of the document.
         * If the document is newly created and hasn’t been set up with a root,
         * an {@link XmlError} will be thrown.
         */
        get root() {
            const root = xmlDocGetRootElement(this._ptr);
            if (!root) {
                // TODO: get error information from libxml2
                throw new XmlError();
            }
            return new XmlElement(root);
        }
        /**
         * Set the root element of the document.
         * @param value The new root.
         * If the node is from another document,
         * it and its subtree will be removed from the previous document.
         */
        set root(value) {
            const old = xmlDocSetRootElement(this._ptr, value._nodePtr);
            if (old) {
                xmlFreeNode(old);
            }
        }
        /**
         * Create the root element.
         * @param name The name of the root element.
         * @param namespace The namespace of the root element.
         * @param prefix The prefix of the root node that represents the given namespace.
         * If not provided, the given namespace will be the default.
         */
        createRoot(name, namespace, prefix) {
            const elem = xmlNewDocNode(this._ptr, 0, name);
            const root = new XmlElement(elem);
            if (namespace) {
                root.addNsDeclaration(namespace, prefix);
                root.namespacePrefix = prefix ?? '';
            }
            this.root = root;
            return root;
        }
        /**
         * Process the XInclude directives in the document synchronously.
         *
         * @returns the number of XInclude nodes processed.
         */
        processXInclude() {
            const errIndex = error.storage.allocate([]);
            const xinc = xmlXIncludeNewContext(this._ptr);
            xmlXIncludeSetErrorHandler(xinc, error.errorCollector, errIndex);
            try {
                const ret = xmlXIncludeProcessNode(xinc, this._ptr);
                if (ret < 0) {
                    const errDetails = error.storage.get(errIndex);
                    throw new XmlParseError(errDetails.map((d) => d.message).join(''), errDetails);
                }
                return ret;
            }
            finally {
                error.storage.free(errIndex);
                xmlXIncludeFreeContext(xinc);
            }
        }
        /**
         * Canonicalize the document and invoke the handler to process.
         *
         * @param handler handlers to process the content in the buffer
         * @param options options to adjust the canonicalization behavior
         * @see {@link canonicalizeToString}
         */
        canonicalize(handler, options) {
            canonicalizeDocument(handler, this, options);
        }
        /**
         * Canonicalize the document to a string.
         *
         * @param options options to adjust the canonicalization behavior
         * @returns The canonicalized XML string
         * @see {@link canonicalize}
         */
        canonicalizeToString(options) {
            const handler = new XmlStringOutputBufferHandler();
            this.canonicalize(handler, options);
            return handler.result;
        }
    };
    __setFunctionName(_classThis, "XmlDocument");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlDocument = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlDocument = _classThis;
})();
export { XmlDocument };
//# sourceMappingURL=document.mjs.map