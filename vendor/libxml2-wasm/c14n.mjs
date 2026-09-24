import { addFunction, allocCStringArray, free, xmlC14NExecute, XmlError, xmlOutputBufferClose, xmlOutputBufferCreateIO, XmlTreeCommonStruct, } from './libxml2.mjs';
import { createNode, createNullableNode } from './nodes.mjs';
import { ContextStorage } from './utils.mjs';
const c14nCallbackStorage = new ContextStorage();
/**
 * Global C14N visibility callback - created once at module initialization.
 * Signature: int(void* user_data, xmlNodePtr node, xmlNodePtr parent)
 * @internal
 */
const c14nIsVisibleCallback = addFunction((userDataIndex, nodePtr, parentPtr) => {
    const ctx = c14nCallbackStorage.get(userDataIndex);
    // Handle nodeSet mode
    if (ctx.rootPtrs !== null) {
        // Visible if node is a selected root, or lies within any selected root subtree
        if (ctx.rootPtrs.has(nodePtr))
            return 1;
        let cur = parentPtr;
        while (cur !== 0) {
            if (ctx.rootPtrs.has(cur))
                return 1;
            cur = XmlTreeCommonStruct.parent(cur);
        }
        return 0;
    }
    // Handle isVisible callback mode
    if (ctx.jsCallback !== null) {
        // Cascade invisibility check
        if (ctx.cascade && ctx.invisible) {
            if (parentPtr !== 0 && ctx.invisible.has(parentPtr)) {
                ctx.invisible.add(nodePtr);
                return 0;
            }
        }
        const res = ctx.jsCallback(createNode(nodePtr), createNullableNode(parentPtr)) ? 1 : 0;
        if (ctx.cascade && ctx.invisible && res === 0) {
            ctx.invisible.add(nodePtr);
        }
        return res;
    }
    /* c8 ignore next 2, callback is not registered if neither is present */
    return 1;
}, 'iiii');
/**
 * C14N (Canonical XML) modes supported by libxml2
 * @see http://www.w3.org/TR/xml-c14n
 * @see http://www.w3.org/TR/xml-exc-c14n
 */
export const XmlC14NMode = {
    /** Original C14N 1.0 specification */
    XML_C14N_1_0: 0,
    /** Exclusive C14N 1.0 (omits unused namespace declarations) */
    XML_C14N_EXCLUSIVE_1_0: 1,
    /** C14N 1.1 specification */
    XML_C14N_1_1: 2,
};
/**
 * Check if a node is within a subtree rooted at a specific node by walking
 * up the parent chain using the libxml-provided parent pointer.
 *
 * Important: Namespace declaration nodes (xmlNs) are not part of the tree and
 * don't have a normal parent field. libxml2 calls the visibility callback with
 * the owning element as `parentPtr`, so we must start walking from `parentPtr`
 * rather than dereferencing the node.
 * @internal
 */
function isNodeInSubtree(nodePtr, parentPtr, rootPtr) {
    if (nodePtr === rootPtr) {
        return true;
    }
    let currentPtr = parentPtr;
    while (currentPtr !== 0) {
        if (currentPtr === rootPtr) {
            return true;
        }
        currentPtr = XmlTreeCommonStruct.parent(currentPtr);
    }
    return false;
}
/**
 * Internal implementation using xmlC14NExecute
 * @internal
 */
function canonicalizeInternal(handler, docPtr, options = {}, cascade = true) {
    const hasIsVisible = (opts) => typeof opts.isVisible === 'function';
    const hasNodeSet = (opts) => opts.nodeSet instanceof Set;
    // Validate mutually exclusive options
    if (hasIsVisible(options) && hasNodeSet(options)) {
        throw new XmlError('Cannot specify both isVisible and nodeSet');
    }
    let outputBufferPtr = null;
    let prefixArrayPtr = 0;
    let contextIndex = 0;
    try {
        // Create output buffer using IO callbacks
        outputBufferPtr = xmlOutputBufferCreateIO(handler);
        // Build callback context based on options
        if (hasIsVisible(options) || hasNodeSet(options)) {
            const context = {
                jsCallback: hasIsVisible(options) ? options.isVisible : null,
                rootPtrs: hasNodeSet(options)
                    ? new Set(Array.from(options.nodeSet)
                        .map((n) => n._nodePtr))
                    : null,
                cascade,
                invisible: cascade ? new Set() : null,
            };
            contextIndex = c14nCallbackStorage.allocate(context);
        }
        // Handle inclusive namespace prefixes
        if (options.inclusiveNamespacePrefixes) {
            prefixArrayPtr = allocCStringArray(options.inclusiveNamespacePrefixes);
        }
        const mode = options.mode ?? XmlC14NMode.XML_C14N_1_0;
        const withComments = options.withComments ? 1 : 0;
        const result = xmlC14NExecute(docPtr, contextIndex !== 0 ? c14nIsVisibleCallback : 0, contextIndex, // user_data is the storage index
        mode, prefixArrayPtr, withComments, outputBufferPtr);
        /* c8 ignore next 3, defensive code */
        if (result < 0) {
            throw new XmlError('Failed to canonicalize XML document');
        }
    }
    finally {
        if (prefixArrayPtr)
            free(prefixArrayPtr);
        if (outputBufferPtr) {
            xmlOutputBufferClose(outputBufferPtr);
        }
        if (contextIndex !== 0) {
            c14nCallbackStorage.free(contextIndex);
        }
    }
}
/**
 * Canonicalize an entire XML document to a buffer and invoke callbacks to process.
 *

 * @param handler Callback to receive the canonicalized output
 * @param doc The XML document to canonicalize
 * @param options Canonicalization options
 *
 * @example
 * ```typescript
 * const handler = new XmlStringOutputBufferHandler();
 * canonicalizeDocument(handler, doc, {
 *   mode: XmlC14NMode.XML_C14N_1_0,
 *   withComments: false
 * });
 * ```
 */
export function canonicalizeDocument(handler, doc, options = {}) {
    canonicalizeInternal(handler, doc._ptr, options);
}
/**
 * Canonicalize a subtree of an XML document to a buffer and invoke callbacks to process.
 *
 * This is a convenience helper that creates an isVisible callback to filter
 * only nodes within the specified subtree.
 *
 * @param handler Callback to receive the canonicalized output
 * @param doc The document containing the subtree
 * @param subtreeRoot The root node of the subtree to canonicalize
 * @param options Canonicalization options (cannot include isVisible or nodeSet)
 *
 * @example
 * ```typescript
 * const element = doc.get('//my-element');
 * const handler = new XmlStringOutputBufferHandler();
 * canonicalizeSubtree(handler, doc, element!, {
 *   mode: XmlC14NMode.XML_C14N_EXCLUSIVE_1_0,
 *   inclusiveNamespacePrefixes: ['ns1', 'ns2'],
 *   withComments: false
 * });
 * ```
 */
export function canonicalizeSubtree(handler, doc, subtreeRoot, options = {}) {
    const subtreeRootPtr = subtreeRoot._nodePtr;
    const isVisible = (node, parent) => (isNodeInSubtree(node._nodePtr, parent ? parent._nodePtr : 0, subtreeRootPtr));
    // Use non-cascading behavior for subtree helper
    canonicalizeInternal(handler, doc._ptr, {
        ...options,
        isVisible,
    }, /* wrapCascade */ false);
}
//# sourceMappingURL=c14n.mjs.map