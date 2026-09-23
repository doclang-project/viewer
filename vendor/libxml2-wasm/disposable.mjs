import { tracker } from './diag.mjs';
import './disposeShim.mjs';
import './metadataShim.mjs';
const symXmlDisposableInternal = Symbol('XmlDisposableInternal');
/** @internal */
export function disposeBy(free) {
    return function decorator(target, context) {
        context.metadata[symXmlDisposableInternal] = {
            instances: new Map(),
            finalization: new FinalizationRegistry(free),
            free,
        };
    };
}
/**
 * The base implementation of the interface Disposable is designed to manage wasm memory.
 *
 * Please remember to call the `dispose()` method for any subclass object.
 *
 * @template T The subclass that inherits from XmlDisposable.
 */
export class XmlDisposable {
    /** @internal */
    constructor(ptr) {
        this._ptr = ptr;
        tracker().trackAllocate(this);
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
     * Dispose the object.
     *
     * It releases the managed resource and unregisters it from FinalizationRegistry.
     * This ensures that the release of the managed resource doesn't have to wait until
     * the object is garbage collected.
     *
     * To avoid resource leaks,
     * explicitly call the `Dispose` method or use the `using` declaration to declare the object.
     *
     * @see {@link dispose}
     */
    [Symbol.dispose]() {
        if (this._ptr === 0)
            return; // already disposed
        const metadata = this.constructor[Symbol.metadata];
        const internal = metadata[symXmlDisposableInternal];
        internal.free(this._ptr);
        // already freed, remove from finalization registry
        internal.finalization.unregister(this);
        // remove from instances registry
        internal.instances.delete(this._ptr);
        tracker().trackDeallocate(this);
        this._ptr = 0;
    }
    /**
     * Get the instance of the class from the pointer.
     * If the instance is not found, create a new instance and register it.
     * @internal
     */
    static getInstance(ptr, ...args) {
        const inst = this.peekInstance(ptr);
        if (inst) {
            return inst;
        }
        const internal = this.getDisposableInternal();
        const newInst = new this(ptr, ...args);
        internal.instances.set(ptr, new WeakRef(newInst));
        internal.finalization.register(newInst, ptr, newInst);
        return newInst;
    }
    /**
     * Get the instance of the class from the pointer.
     * If the instance is not found, return null.
     * @internal
     */
    static peekInstance(ptr) {
        const internal = this.getDisposableInternal();
        const instRef = internal.instances.get(ptr);
        if (instRef) {
            return instRef.deref() ?? null;
        }
        return null;
    }
    /**
     * The mapping of the pointer to the WeakRef instance is stored in the
     * `XmlDisposableInternal` object of the metadata of the class.
     * @internal
     */
    static getDisposableInternal() {
        const metadata = this[Symbol.metadata];
        const internal = metadata[symXmlDisposableInternal];
        return internal;
    }
}
//# sourceMappingURL=disposable.mjs.map