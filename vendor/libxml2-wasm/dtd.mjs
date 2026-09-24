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
import { disposeBy, XmlDisposable } from './disposable.mjs';
import { XmlDocument, XmlParseError } from './document.mjs';
import { error, xmlCtxtParseDtd, xmlCtxtSetErrorHandler, xmlFreeDtd, xmlFreeParserCtxt, xmlNewParserCtxt, XmlTreeCommonStruct, } from './libxml2.mjs';
function freeDtd(ptr) {
    if (XmlTreeCommonStruct.parent(ptr) !== 0) {
        // owned by a document, do not free
        return;
    }
    xmlFreeDtd(ptr);
}
/**
 * Represents a Document Type Definition (DTD) in XML.
 *
 * If the DTD is not owned by a document, {@link XmlDtd#dispose} needs to be called to free the DTD.
 */
let XmlDtd = (() => {
    let _classDecorators = [disposeBy(freeDtd)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlDisposable;
    var XmlDtd = _classThis = class extends _classSuper {
        /**
         * The owner document of this DTD.
         *
         * If the DTD is not owned by a document, this will be `null`.
         */
        get doc() {
            const docPtr = XmlTreeCommonStruct.doc(this._ptr);
            return docPtr ? XmlDocument.getInstance(docPtr) : null;
        }
        /**
         * Parse a DTD from a buffer.
         */
        static fromBuffer(buffer) {
            const parserCtxt = xmlNewParserCtxt();
            const errIndex = error.storage.allocate([]);
            xmlCtxtSetErrorHandler(parserCtxt, error.errorCollector, errIndex);
            const ptr = xmlCtxtParseDtd(parserCtxt, buffer, null, null);
            const errDetails = error.storage.get(errIndex);
            error.storage.free(errIndex);
            xmlFreeParserCtxt(parserCtxt);
            if (!ptr) {
                throw new XmlParseError(errDetails.map((d) => d.message).join(''), errDetails);
            }
            return XmlDtd.getInstance(ptr);
        }
        /**
         * Parse a DTD from a string.
         */
        static fromString(str) {
            return this.fromBuffer(new TextEncoder().encode(str));
        }
    };
    __setFunctionName(_classThis, "XmlDtd");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XmlDtd = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XmlDtd = _classThis;
})();
export { XmlDtd };
//# sourceMappingURL=dtd.mjs.map