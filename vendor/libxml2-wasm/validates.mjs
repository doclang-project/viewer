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
import { XmlDocument } from './document.mjs';
import { error, xmlCtxtSetErrorHandler, xmlCtxtValidateDtd, XmlError, xmlFreeParserCtxt, XmlLibError, xmlNewParserCtxt, xmlRelaxNGFree, xmlRelaxNGFreeParserCtxt, xmlRelaxNGFreeValidCtxt, xmlRelaxNGNewDocParserCtxt, xmlRelaxNGNewValidCtxt, xmlRelaxNGParse, xmlRelaxNGSetParserStructuredErrors, xmlRelaxNGSetValidStructuredErrors, xmlRelaxNGValidateDoc, xmlSchemaFree, xmlSchemaFreeParserCtxt, xmlSchemaFreeValidCtxt, xmlSchemaNewDocParserCtxt, xmlSchemaNewValidCtxt, xmlSchemaParse, xmlSchemaSetParserStructuredErrors, xmlSchemaSetValidStructuredErrors, xmlSchemaValidateDoc, xmlSchemaValidateOneElement, } from './libxml2.mjs';
/**
 * The exception that is thrown when validating XML against a schema.
 */
export class XmlValidateError extends XmlLibError {
    static fromDetails(details) {
        return new XmlValidateError(details.map((d) => d.message).join(''), details);
    }
}
/**
 * The DTD validator.
 *
 * Note: This validator needs to be disposed explicitly if the DTD is not owned by a document.
 *
 * @see {@link XmlDtd}
 * @see {@link "[dispose]"}
 */
export class DtdValidator {
    constructor(dtd) {
        this._dtd = dtd;
    }
    /**
     * Validate the XmlDocument.
     *
     * @param doc The XmlDocument to be validated.
     * @throws an {@link XmlValidateError} if the document is invalid.
     */
    validate(doc) {
        const ctxt = xmlNewParserCtxt();
        const errIndex = error.storage.allocate([]);
        xmlCtxtSetErrorHandler(ctxt, error.errorCollector, errIndex);
        const ret = xmlCtxtValidateDtd(ctxt, doc._ptr, this._dtd._ptr);
        const errDetails = error.storage.get(errIndex);
        error.storage.free(errIndex);
        xmlFreeParserCtxt(ctxt);
        if (ret !== 1) {
            throw XmlValidateError.fromDetails(errDetails);
        }
    }
    /**
     * Alias of {@link "[dispose]"}.
     *
     * @see {@link "[dispose]"}
     */
    dispose() {
        this[Symbol.dispose]();
    }
    /**
     * Dispose the {@link XmlDtd} object.
     *
       To avoid resource leaks,
       explicitly call the `Dispose` method or use the `using` declaration to declare the object.
     *
     * @see {@link dispose}
     */
    [Symbol.dispose]() {
        this._dtd.dispose();
    }
}
/**
 * The RelaxNG schema validator.
 *
 * Note: This validator must be disposed explicitly.
 *
 * @deprecated libxml2 is planing to remove this:
 * https://gitlab.gnome.org/GNOME/libxml2/-/releases/v2.14.0#planned-removals
 */
let RelaxNGValidator = (() => {
    let _classDecorators = [disposeBy(xmlRelaxNGFree)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlDisposable;
    var RelaxNGValidator = _classThis = class extends _classSuper {
        /**
         * Validate the XmlDocument.
         *
         * @param doc The XmlDocument to be validated.
         * @throws an {@link XmlValidateError} if the document is invalid;
         * @throws an {@link XmlError} or {@link XmlValidateError} if there’s an error,
         * such as validating a document that’s already disposed, etc.
         */
        validate(doc) {
            const ctxt = xmlRelaxNGNewValidCtxt(this._ptr);
            const errIndex = error.storage.allocate([]);
            xmlRelaxNGSetValidStructuredErrors(ctxt, error.errorCollector, errIndex);
            const ret = xmlRelaxNGValidateDoc(ctxt, doc._ptr);
            const errDetails = error.storage.get(errIndex);
            error.storage.free(errIndex);
            xmlRelaxNGFreeValidCtxt(ctxt);
            if (ret < 0) {
                throw new XmlError('Invalid input or internal error');
            }
            if (ret > 0) {
                throw XmlValidateError.fromDetails(errDetails);
            }
        }
        /**
         * Creates a RelaxNGValidator instance from an XmlDocument.
         * @param rng The XmlDocument representing the RelaxNG schema
         * @throws an {@link XmlError} or {@link XmlValidateError} if something goes wrong.
         */
        static fromDoc(rng) {
            // prepare parsing context for Relax NG
            const ctx = xmlRelaxNGNewDocParserCtxt(rng._ptr);
            if (ctx === 0) {
                throw new XmlError('Schema is null or failed to allocate memory');
            }
            const errIndex = error.storage.allocate([]);
            xmlRelaxNGSetParserStructuredErrors(ctx, error.errorCollector, errIndex);
            // parse relax NG validator from DOM
            const schema = xmlRelaxNGParse(ctx);
            // handle parsing errors and cleanup
            const errDetails = error.storage.get(errIndex);
            error.storage.free(errIndex);
            xmlRelaxNGFreeParserCtxt(ctx);
            if (schema === 0) {
                throw XmlValidateError.fromDetails(errDetails);
            }
            // create Validator object
            return new RelaxNGValidator(schema);
        }
    };
    __setFunctionName(_classThis, "RelaxNGValidator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RelaxNGValidator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RelaxNGValidator = _classThis;
})();
export { RelaxNGValidator };
/**
 * The XSD schema validator.
 *
 * Note: This validator needs to be disposed explicitly.
 */
let XsdValidator = (() => {
    let _classDecorators = [disposeBy(xmlSchemaFree)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = XmlDisposable;
    var XsdValidator = _classThis = class extends _classSuper {
        validate(docOrElem) {
            const ctx = xmlSchemaNewValidCtxt(this._ptr);
            const errIndex = error.storage.allocate([]);
            xmlSchemaSetValidStructuredErrors(ctx, error.errorCollector, errIndex);
            const ret = docOrElem instanceof XmlDocument
                ? xmlSchemaValidateDoc(ctx, docOrElem._ptr)
                : xmlSchemaValidateOneElement(ctx, docOrElem._nodePtr);
            const errDetails = error.storage.get(errIndex);
            error.storage.free(errIndex);
            xmlSchemaFreeValidCtxt(ctx);
            if (ret < 0) {
                throw new XmlError('Invalid input or internal error');
            }
            if (ret > 0) {
                throw XmlValidateError.fromDetails(errDetails);
            }
        }
        /**
         * Create an XsdValidator instance from an {@link XmlDocument} object.
         *
         * @param xsd The XSD schema, parsed in to an XmlDocument object.
         * @throws an {@link XmlError} or {@link XmlValidateError} if something goes wrong.
         */
        static fromDoc(xsd) {
            // prepare parsing context for XSD
            const ctx = xmlSchemaNewDocParserCtxt(xsd._ptr);
            if (ctx === 0) {
                throw new XmlError('Schema is null or failed to allocate memory');
            }
            const errIndex = error.storage.allocate([]);
            xmlSchemaSetParserStructuredErrors(ctx, error.errorCollector, errIndex);
            // parse XSD validator from DOM
            const schema = xmlSchemaParse(ctx);
            // handle parsing errors and cleanup
            const errDetails = error.storage.get(errIndex);
            error.storage.free(errIndex);
            xmlSchemaFreeParserCtxt(ctx);
            if (schema === 0) {
                throw XmlValidateError.fromDetails(errDetails);
            }
            // create Validator object
            return new XsdValidator(schema);
        }
    };
    __setFunctionName(_classThis, "XsdValidator");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        XsdValidator = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return XsdValidator = _classThis;
})();
export { XsdValidator };
//# sourceMappingURL=validates.mjs.map