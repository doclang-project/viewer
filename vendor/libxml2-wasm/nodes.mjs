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
import { canonicalizeSubtree } from './c14n.mjs';
import { XmlDocument } from './document.mjs';
import { xmlAddChild, xmlAddNextSibling, xmlAddPrevSibling, XmlError, XmlErrorStruct, xmlFreeNode, xmlGetLastError, xmlGetNsList, xmlHasNsProp, XmlNamedNodeStruct, xmlNewCDataBlock, xmlNewDocComment, xmlNewDocNode, xmlNewDocText, xmlNewNs, xmlNewReference, xmlNodeGetContent, xmlNodeSetContent, XmlNodeSetStruct, XmlNodeStruct, XmlNodeType, XmlNsStruct, xmlRemoveProp, xmlResetLastError, xmlSaveClose, xmlSaveOption, xmlSaveSetIndentString, xmlSaveToIO, xmlSaveTree, xmlSearchNs, xmlSetNs, xmlSetNsProp, xmlUnlinkNode, xmlXPathCompiledEval, xmlXPathFreeContext, xmlXPathFreeObject, xmlXPathNewContext, XmlXPathObjectStruct, xmlXPathRegisterNs, xmlXPathSetContextNode, } from './libxml2.mjs';
import { XmlStringOutputBufferHandler } from './utils.mjs';
import { XmlXPath, XmlXPathError } from './xpath.mjs';
function compiledXPathEval(nodePtr, xpath) {
    const context = xmlXPathNewContext(XmlNodeStruct.doc(nodePtr));
    if (xpath.namespaces) {
        Object.entries(xpath.namespaces)
            .forEach(([prefix, uri]) => {
            xmlXPathRegisterNs(context, prefix, uri);
        });
    }
    xmlXPathSetContextNode(nodePtr, context);
    xmlResetLastError();
    const xpathObj = xmlXPathCompiledEval(xpath._ptr, context);
    xmlXPathFreeContext(context);
    if (xpathObj === 0) {
        // xmlXPathCompiledEval returns NULL on a runtime evaluation failure, e.g. an
        // undefined namespace prefix, variable, or function. Forward libxml2's own
        // diagnostic instead of letting the null pointer surface downstream as a
        // generic 'Access with null pointer' error. libxml2 exposes no XPath-context
        // error handler to bind, so read the global last-error (cleared above) rather
        // than a context-scoped collector as parse()/XInclude do.
        const lastError = xmlGetLastError();
        const detail = lastError === 0 ? '' : `: ${XmlErrorStruct.message(lastError).trim()}`;
        throw new XmlXPathError(`Failed to evaluate XPath expression '${xpath.toString()}'${detail}`);
    }
    return xpathObj;
}
function xpathEval(nodePtr, xpath, namespaces) {
    const xpathCompiled = xpath instanceof XmlXPath
        ? xpath
        : XmlXPath.compile(xpath, namespaces);
    const ret = compiledXPathEval(nodePtr, xpathCompiled);
    if (!(xpath instanceof XmlXPath)) {
        xpathCompiled.dispose();
    }
    return ret;
}
const nodeConstructors = new Map();
/** @internal */
export function forNodeType(nodeType) {
    return function decorator(constructor, _context_) {
        nodeConstructors.set(nodeType, constructor);
        return constructor;
    };
}
/** @internal */
export function createNode(nodePtr) {
    const nodeType = XmlNodeStruct.type(nodePtr);
    const Constructor = nodeConstructors.get(nodeType);
    /* c8 ignore next 3, defensive code, there's no test case can cover this */
    if (!Constructor) {
        throw new XmlError(`Unsupported node type ${nodeType}`);
    }
    return new Constructor(nodePtr);
}
/** @internal */
export function createNullableNode(nodePtr) {
    return nodePtr ? createNode(nodePtr) : null;
}
function addNode(nodePtr, content, create, process) {
    let newNode = create(XmlNodeStruct.doc(nodePtr), content);
    newNode = process(nodePtr, newNode);
    return newNode;
}
function findNamespace(nodePtr, prefix) {
    // Check if the namespace prefix valid for the current node
    const ns = xmlSearchNs(XmlNodeStruct.doc(nodePtr), nodePtr, prefix ?? null);
    if (!ns && prefix) {
        throw new XmlError(`Namespace prefix "${prefix}" not found`);
    }
    return ns;
}
function addElement(nodePtr, name, prefix) {
    const ns = findNamespace(nodePtr, prefix);
    return xmlNewDocNode(XmlNodeStruct.doc(nodePtr), ns, name);
}
/**
 * The base class for all types of XML nodes.
 */
export class XmlNode {
    /** @internal */
    constructor(nodePtr) {
        this._nodePtr = nodePtr;
    }
    /**
     * The {@link XmlDocument} containing this node.
     */
    get doc() {
        return XmlDocument.getInstance(XmlNodeStruct.doc(this._nodePtr));
    }
    /**
     * Remove the node from its parent.
     */
    remove() {
        if (!this._nodePtr) {
            return;
        }
        xmlUnlinkNode(this._nodePtr);
        xmlFreeNode(this._nodePtr);
        this._nodePtr = 0;
    }
    /**
     * The parent node of this node.
     *
     * For root node, its parent is null.
     */
    get parent() {
        const parent = XmlNodeStruct.parent(this._nodePtr);
        if (!parent || parent === XmlNodeStruct.doc(this._nodePtr)) {
            return null;
        }
        return new XmlElement(parent);
    }
    /**
     * The content string of the node.
     */
    get content() {
        return xmlNodeGetContent(this._nodePtr);
    }
    /**
     * The line number of the node if the node is parsed from an XML document.
     */
    get line() {
        return XmlNodeStruct.line(this._nodePtr);
    }
    /**
     * Check if this node is the same as another node.
     */
    isSameNode(other) {
        return this._nodePtr === other._nodePtr;
    }
    /**
     * Canonicalize this node and its subtree to a buffer and invoke the handler to process.
     *
     * @param handler handlers to process the content in the buffer
     * @param options options to adjust the canonicalization behavior
     * @see {@link canonicalizeToString}
     */
    canonicalize(handler, options) {
        canonicalizeSubtree(handler, this.doc, this, options);
    }
    /**
     * Canonicalize this node and its subtree and return the result as a string.
     *
     * @param options options to adjust the canonicalization behavior
     * @returns The canonicalized XML string.
     * @see {@link canonicalize}
     */
    canonicalizeToString(options) {
        const handler = new XmlStringOutputBufferHandler();
        this.canonicalize(handler, options);
        return handler.result;
    }
    get(xpath, namespaces) {
        const xpathObj = xpathEval(this._nodePtr, xpath, namespaces);
        let ret;
        if (XmlXPathObjectStruct.type(xpathObj) !== XmlXPathObjectStruct.Type.XPATH_NODESET) {
            xmlXPathFreeObject(xpathObj);
            throw new XmlError('XPath selector must return a node set');
        }
        const nodeSet = XmlXPathObjectStruct.nodesetval(xpathObj);
        if (nodeSet === 0 || XmlNodeSetStruct.nodeCount(nodeSet) === 0) {
            ret = null;
        }
        else {
            ret = createNode(XmlNodeSetStruct.nodeTable(nodeSet, 1)[0]);
        }
        xmlXPathFreeObject(xpathObj);
        return ret;
    }
    find(xpath, namespaces) {
        const nodes = this.eval(xpath, namespaces);
        if (Array.isArray(nodes)) {
            return nodes;
        }
        throw new XmlError('XPath selector must return a node set');
    }
    eval(xpath, namespaces) {
        const xpathObj = xpathEval(this._nodePtr, xpath, namespaces);
        try {
            switch (XmlXPathObjectStruct.type(xpathObj)) {
                case XmlXPathObjectStruct.Type.XPATH_NODESET: {
                    const nodes = [];
                    const nodeSet = XmlXPathObjectStruct.nodesetval(xpathObj);
                    const nodeCount = XmlNodeSetStruct.nodeCount(nodeSet);
                    const nodeTable = XmlNodeSetStruct.nodeTable(nodeSet, nodeCount);
                    for (let i = 0; i < nodeCount; i += 1) {
                        nodes.push(createNode(nodeTable[i]));
                    }
                    return nodes;
                }
                case XmlXPathObjectStruct.Type.XPATH_NUMBER: {
                    return XmlXPathObjectStruct.floatval(xpathObj);
                }
                case XmlXPathObjectStruct.Type.XPATH_BOOLEAN: {
                    return XmlXPathObjectStruct.boolval(xpathObj) !== 0;
                }
                case XmlXPathObjectStruct.Type.XPATH_STRING: {
                    return XmlXPathObjectStruct.stringval(xpathObj);
                }
                /* c8 ignore next 4, defensive code, there's no test case can cover this */
                default:
                    throw new XmlError(`XPath selector returned an unsupported type: ${XmlXPathObjectStruct.type(xpathObj)}`);
            }
        }
        finally {
            xmlXPathFreeObject(xpathObj);
        }
    }
}
/**
 *
 */
let XmlDocumentNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_DOCUMENT_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlDocumentNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlDocumentNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlDocumentNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlDocumentNode = _classThis;
})();
export { XmlDocumentNode };
let XmlDocumentTypeNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_DTD_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlDocumentTypeNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlDocumentTypeNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlDocumentTypeNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlDocumentTypeNode = _classThis;
})();
export { XmlDocumentTypeNode };
let XmlElementDeclNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ELEMENT_DECL)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlElementDeclNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlElementDeclNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlElementDeclNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlElementDeclNode = _classThis;
})();
export { XmlElementDeclNode };
let XmlAttributeDeclNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ATTRIBUTE_DECL)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlAttributeDeclNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlAttributeDeclNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlAttributeDeclNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlAttributeDeclNode = _classThis;
})();
export { XmlAttributeDeclNode };
let XmlEntityDeclNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ENTITY_DECL)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlEntityDeclNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlEntityDeclNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlEntityDeclNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlEntityDeclNode = _classThis;
})();
export { XmlEntityDeclNode };
let XmlNamespaceDeclNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_NAMESPACE_DECL)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlNamespaceDeclNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlNamespaceDeclNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlNamespaceDeclNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlNamespaceDeclNode = _classThis;
})();
export { XmlNamespaceDeclNode };
let XmlProcessingInstructionNode = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_PI_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlProcessingInstructionNode = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlProcessingInstructionNode");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlProcessingInstructionNode = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlProcessingInstructionNode = _classThis;
})();
export { XmlProcessingInstructionNode };
/**
 * The base class representing a node that can have siblings.
 */
export class XmlTreeNode extends XmlNode {
    /**
     * Add a comment sibling node after this node.
     *
     * @param content the content of the comment
     *
     * @see {@link prependComment}
     * @see {@link XmlElement#addComment}
     */
    appendComment(content) {
        return new XmlComment(addNode(this._nodePtr, content, xmlNewDocComment, xmlAddNextSibling));
    }
    /**
     * Insert a comment sibling node before this node.
     * @param content the content of the comment
     *
     * @see {@link appendComment}
     * @see {@link XmlElement#addComment}
     */
    prependComment(content) {
        return new XmlComment(addNode(this._nodePtr, content, xmlNewDocComment, xmlAddPrevSibling));
    }
    /**
     * Add a CDATA section sibling node after this node.
     * @param content the content of the CDATA section
     *
     * @see {@link prependCData}
     * @see {@link XmlElement#addCData}
     */
    appendCData(content) {
        return new XmlCData(addNode(this._nodePtr, content, xmlNewCDataBlock, xmlAddNextSibling));
    }
    /**
     * Insert a CDATA section sibling node before this node.
     * @param content the content of the CDATA section
     *
     * @see {@link appendCData}
     * @see {@link XmlElement#addCData}
     */
    prependCData(content) {
        return new XmlCData(addNode(this._nodePtr, content, xmlNewCDataBlock, xmlAddPrevSibling));
    }
    /**
     * Add an element sibling node after this node.
     * @param name the element name
     * @param prefix the prefix of the element for the namespace
     *
     * @see {@link prependElement}
     * @see {@link XmlElement#addElement}
     */
    appendElement(name, prefix) {
        const node = addElement(this._nodePtr, name, prefix);
        xmlAddNextSibling(this._nodePtr, node);
        return new XmlElement(node);
    }
    /**
     * Insert an element sibling node before this node.
     * @param name the element name
     * @param prefix the prefix of the element for the namespace
     *
     * @see {@link appendElement}
     * @see {@link XmlElement#addElement}
     */
    prependElement(name, prefix) {
        const node = addElement(this._nodePtr, name, prefix);
        xmlAddPrevSibling(this._nodePtr, node);
        return new XmlElement(node);
    }
    /**
     * Add a text sibling node after this node.
     * @param text the content of the text node
     *
     * @see {@link prependText}
     * @see {@link XmlElement#addText}
     */
    appendText(text) {
        return new XmlText(addNode(this._nodePtr, text, xmlNewDocText, xmlAddNextSibling));
    }
    /**
     * Insert a text sibling node before this node.
     * @param text the content of the text node
     *
     * @see {@link appendText}
     * @see {@link XmlElement#addText}
     */
    prependText(text) {
        return new XmlText(addNode(this._nodePtr, text, xmlNewDocText, xmlAddPrevSibling));
    }
    /**
     * Add an entity reference sibling node after this node.
     * @param name the name of the entity reference
     * @see {@link prependEntityReference}
     * @see {@link XmlElement#addEntityReference}
     */
    appendEntityReference(name) {
        return new XmlEntityReference(addNode(this._nodePtr, name, xmlNewReference, xmlAddNextSibling));
    }
    /**
     * Insert an entity reference sibling node before this node.
     * @param name the name of the entity reference
     * @see {@link appendEntityReference}
     * @see {@link XmlElement#addEntityReference}
     */
    prependEntityReference(name) {
        return new XmlEntityReference(addNode(this._nodePtr, name, xmlNewReference, xmlAddPrevSibling));
    }
    /**
     * The node that represents the next sibling.
     *
     * @return null if this node is the last one.
     *
     * @see
     *  - {@link XmlElement#firstChild}
     *  - {@link XmlElement#lastChild}
     *  - {@link prev}
     */
    get next() {
        const child = XmlNodeStruct.next(this._nodePtr);
        return createNullableNode(child);
    }
    /**
     * The node that represents the previous sibling.
     *
     * @return null if this node is the first one.
     *
     * @see
     *  - {@link XmlElement#firstChild}
     *  - {@link XmlElement#lastChild}
     *  - {@link next}
     */
    get prev() {
        const child = XmlNodeStruct.prev(this._nodePtr);
        return createNullableNode(child);
    }
}
function namedNode(target, _context_) {
    Object.defineProperties(target.prototype, {
        namespaces: {
            get() {
                return xmlGetNsList(XmlNodeStruct.doc(this._nodePtr), this._nodePtr).reduce(
                // convert to object
                (prev, curr) => ({
                    ...prev,
                    [XmlNsStruct.prefix(curr)]: XmlNsStruct.href(curr),
                }), {});
            },
        },
        namespaceForPrefix: {
            value(prefix) {
                const ns = xmlSearchNs(XmlNodeStruct.doc(this._nodePtr), this._nodePtr, prefix);
                return ns ? XmlNsStruct.href(ns) : null;
            },
        },
        name: {
            get() {
                return XmlNodeStruct.name_(this._nodePtr);
            },
        },
        namespaceUri: {
            get() {
                const namespace = XmlNamedNodeStruct.namespace(this._nodePtr);
                if (namespace) {
                    return XmlNsStruct.href(namespace);
                }
                return '';
            },
        },
        namespacePrefix: {
            get() {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this.prefix; // the linter can't analyze this properly
            },
            set(prefix) {
                this.prefix = prefix;
            },
        },
        prefix: {
            get() {
                const namespace = XmlNamedNodeStruct.namespace(this._nodePtr);
                if (namespace) {
                    return XmlNsStruct.prefix(namespace);
                }
                return '';
            },
            set(prefix) {
                const ns = findNamespace(this._nodePtr, prefix);
                xmlSetNs(this._nodePtr, ns);
            },
        },
    });
}
/**
 * The class representing an XML element node.
 */
let XmlElement = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ELEMENT_NODE), namedNode];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlTreeNode;
    var XmlElement = _classThis = class extends _classSuper {
        /**
         * The node representing the first child of an element.
         *
         * Note that the children of an element do not include attributes.
         *
         * @return null if this node has no child.
         *
         * @see
         *  - {@link lastChild}
         *  - {@link next}
         *  - {@link prev}
         */
        get firstChild() {
            const child = XmlNodeStruct.children(this._nodePtr);
            return createNullableNode(child);
        }
        /**
         * The node representing the last child of an element.
         *
         * Note that the children of an element do not include attributes.
         *
         * Return null if this node has no child
         *
         * @see
         *  - {@link firstChild}
         *  - {@link next}
         *  - {@link prev}
         */
        get lastChild() {
            const child = XmlNodeStruct.last(this._nodePtr);
            return createNullableNode(child);
        }
        /**
         * All attributes of this element.
         */
        get attrs() {
            const attrs = [];
            for (let attr = XmlNodeStruct.properties(this._nodePtr); attr; attr = XmlNodeStruct.next(attr)) {
                attrs.push(new XmlAttribute(attr));
            }
            return attrs;
        }
        /**
         * Namespace declarations on this element
         *
         * @returns Empty object if there's no local namespace definition on this element.
         * Note that the default namespace uses empty string as the key in the returned object.
         */
        get nsDeclarations() {
            const namespaces = {};
            for (let ns = XmlNodeStruct.nsDef(this._nodePtr); ns; ns = XmlNsStruct.next(ns)) {
                namespaces[XmlNsStruct.prefix(ns)] = XmlNsStruct.href(ns);
            }
            return namespaces;
        }
        /**
         * @deprecated use {@link nsDeclarations} instead.
         */
        get localNamespaces() {
            return this.nsDeclarations;
        }
        /**
         * Add a namespace declaration to this element.
         * @param uri The namespace URI.
         * @param prefix The prefix that the namespace to be used as.
         * If not provided, it will be treated as the default namespace.
         *
         * @throws XmlError if namespace declaration already exists.
         */
        addNsDeclaration(uri, prefix) {
            const namespace = xmlNewNs(this._nodePtr, uri, prefix);
            if (!namespace) {
                throw new XmlError(`Failed to add namespace declaration "${prefix}"`);
            }
        }
        /**
         * @deprecated use {@link addNsDeclaration} instead.
         */
        addLocalNamespace(uri, prefix) {
            this.addNsDeclaration(uri, prefix);
        }
        /**
         * Get the attribute of this element.
         * @param name The name of the attribute
         * @param prefix The namespace prefix to the attribute.
         * @return null if the attribute doesn't exist.
         */
        attr(name, prefix) {
            const namespace = prefix ? this.namespaceForPrefix(prefix) : null;
            const attrPtr = xmlHasNsProp(this._nodePtr, name, namespace);
            if (!attrPtr) {
                return null;
            }
            return new XmlAttribute(attrPtr);
        }
        /**
         * Set the attribute of this element.
         * @param name The name of the attribute
         * @param value The value of the attribute
         * @param prefix The namespace prefix to the attribute.
         */
        setAttr(name, value, prefix) {
            const ns = findNamespace(this._nodePtr, prefix);
            return new XmlAttribute(xmlSetNsProp(this._nodePtr, ns, name, value));
        }
        /**
         * Add a child comment node to the end of the children list.
         * @param content the content of the comment
         *
         * @see {@link appendComment}
         * @see {@link prependComment}
         */
        addComment(content) {
            return new XmlComment(addNode(this._nodePtr, content, xmlNewDocComment, xmlAddChild));
        }
        /**
         * Add a child CDATA section node to the end of the children list.
         * @param content the content of the CDATA section
         *
         * @see {@link appendCData}
         * @see {@link prependCData}
         */
        addCData(content) {
            return new XmlCData(addNode(this._nodePtr, content, xmlNewCDataBlock, xmlAddChild));
        }
        /**
         * Add a new element to the end of the children list.
         * @param name the element name
         * @param prefix the prefix of the element for the namespace
         *
         * @see {@link appendElement}
         * @see {@link prependElement}
         */
        addElement(name, prefix) {
            const node = addElement(this._nodePtr, name, prefix);
            xmlAddChild(this._nodePtr, node);
            return new XmlElement(node);
        }
        /**
         * Add a child text node to the end of the children list.
         * Note that this method will merge the text node if the last child is also a text node.
         * @param text the content of the text node
         *
         * @see {@link appendText}
         * @see {@link prependText}
         */
        addText(text) {
            return new XmlText(addNode(this._nodePtr, text, xmlNewDocText, xmlAddChild));
        }
        /**
         * Add a child entity reference node to the end of the children list.
         * @param name the name of the entity reference
         * @see {@link prependEntityReference}
         * @see {@link appendEntityReference}
         */
        addEntityReference(name) {
            return new XmlEntityReference(addNode(this._nodePtr, name, xmlNewReference, xmlAddChild));
        }
        /**
         * Save the XmlElement to a buffer and invoke the callbacks to process.
         *
         * By default, it outputs utf-8 encoded bytes. Use `options.encoding` to change it.
         *
         * @param handler handlers to process the content in the buffer
         * @param options options to adjust the saving behavior
         * @see {@link toString}
         * @see {@link XmlDocument#save}
         */
        save(handler, options) {
            const ctxt = xmlSaveToIO(handler, options?.encoding ?? 'utf-8', xmlSaveOption(options));
            if (options?.indentString) {
                if (xmlSaveSetIndentString(ctxt, options.indentString) < 0) {
                    throw new XmlError('Failed to set indent string');
                }
            }
            xmlSaveTree(ctxt, this._nodePtr);
            xmlSaveClose(ctxt);
        }
        /**
         * Save the XmlElement to a string
         *
         * By default, it outputs utf-8 encoded bytes,
         * while `ascii` is another allowed option for `options.encoding`,
         * which converts non-ascii characters into numeric character references.
         *
         * @param options options to adjust the saving behavior
         * @see {@link save}
         * @see {@link XmlDocument#toString}
         */
        toString(options) {
            const saveOptions = options ?? { format: true };
            if (saveOptions.encoding && saveOptions.encoding !== 'utf-8'
                && saveOptions.encoding !== 'ascii') {
                throw new XmlError('Only utf-8 or ascii is supported in toString(). For other encodings, use save().');
            }
            const handler = new XmlStringOutputBufferHandler();
            this.save(handler, saveOptions);
            return handler.result;
        }
    };
    __setFunctionName(_classThis, "XmlElement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlElement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlElement = _classThis;
})();
export { XmlElement };
/**
 * The class representing an XML attribute node.
 */
let XmlAttribute = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ATTRIBUTE_NODE), namedNode];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlNode;
    var XmlAttribute = _classThis = class extends _classSuper {
        /**
         * Remove current attribute from the element and document.
         */
        remove() {
            if (!this._nodePtr) {
                return;
            }
            /* c8 ignore next 3, defensive code, this always succeeds */
            if (xmlRemoveProp(this._nodePtr)) {
                throw new XmlError('Failed to remove attribute');
            }
            this._nodePtr = 0;
        }
        /**
         * The value of this attribute.
         */
        get value() {
            return super.content;
        }
        /**
         * Set the value of this attribute.
         */
        set value(value) {
            xmlNodeSetContent(this._nodePtr, value);
        }
        /**
         * Alias of {@link value}.
         */
        get content() {
            return this.value;
        }
        set content(value) {
            this.value = value;
        }
    };
    __setFunctionName(_classThis, "XmlAttribute");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlAttribute = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlAttribute = _classThis;
})();
export { XmlAttribute };
/**
 * A simple node that contains only text content without children.
 */
export class XmlSimpleNode extends XmlTreeNode {
    get content() {
        return super.content;
    }
    /**
     * Set the content of the node.
     * @param value the new content
     */
    set content(value) {
        xmlNodeSetContent(this._nodePtr, value);
    }
}
let XmlCData = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_CDATA_SECTION_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlSimpleNode;
    var XmlCData = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlCData");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlCData = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlCData = _classThis;
})();
export { XmlCData };
let XmlComment = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_COMMENT_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlSimpleNode;
    var XmlComment = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlComment");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlComment = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlComment = _classThis;
})();
export { XmlComment };
let XmlText = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_TEXT_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlSimpleNode;
    var XmlText = _classThis = class extends _classSuper {
    };
    __setFunctionName(_classThis, "XmlText");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlText = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlText = _classThis;
})();
export { XmlText };
let XmlEntityReference = (() => {
    let _classDecorators = [forNodeType(XmlNodeType.XML_ENTITY_REF_NODE)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlTreeNode;
    var XmlEntityReference = _classThis = class extends _classSuper {
        /**
         * The name of the entity this node references.
         */
        get name() {
            return XmlNodeStruct.name_(this._nodePtr);
        }
    };
    __setFunctionName(_classThis, "XmlEntityReference");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlEntityReference = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlEntityReference = _classThis;
})();
export { XmlEntityReference };
//# sourceMappingURL=nodes.mjs.map