/**
 * Manage JS context object for wasm.
 *
 * In libxml2, a registration of callback often has a context/userdata pointer.
 * But when it is in wasm, this pointer is essentially an integer.
 *
 * To support JS object as context/userdata, we store it in the map and access with an integer key.
 * This key could be passed to the registration.
 * And the callback use this key to retrieve the real object.
 */
export class ContextStorage {
    constructor() {
        this.storage = new Map();
        this.index = 0;
    }
    allocate(value) {
        this.index += 1;
        this.storage.set(this.index, value);
        return this.index;
    }
    free(index) {
        this.storage.delete(index);
    }
    get(index) {
        return this.storage.get(index);
    }
}
const bufferContexts = new Map();
let contextIndex = 1;
/**
 * A XmlInputProvider implementation that reads from buffers.
 *
 * This can be passed to {@link xmlRegisterInputProvider} to read XML content from memory.
 */
export class XmlBufferInputProvider {
    /**
     * Create a new XmlBufferInputProvider with a set of buffers.
     * @param data The buffers by their filename.
     */
    constructor(data) {
        this._data = data;
    }
    /**
     * Add a buffer to the provider.
     * @param filename The filename of the buffer.
     * @param buffer The buffer to add.
     */
    addBuffer(filename, buffer) {
        this._data[filename] = buffer;
    }
    /**
     * Remove a buffer from the provider.
     * @param filename The filename of the buffer to remove.
     */
    removeBuffer(filename) {
        delete this._data[filename];
    }
    buffer(filename) {
        const buf = Object.hasOwn(this._data, filename) ? this._data[filename] : undefined;
        return buf instanceof Uint8Array ? buf : undefined;
    }
    match(filename) {
        return this.buffer(filename) !== undefined;
    }
    open(filename) {
        const buf = this.buffer(filename);
        return buf !== undefined ? openBuffer(buf) : undefined;
    }
    read(fd, buffer) {
        return readBuffer(fd, buffer);
    }
    close(fd) {
        closeBuffer(fd);
        return true;
    }
}
/**
 * Open a buffer for reading.
 * @param buffer The buffer to read from.
 * @returns The file descriptor for the buffer reader.
 */
export function openBuffer(buffer) {
    const fd = contextIndex;
    bufferContexts.set(fd, [buffer, 0]);
    contextIndex += 1;
    return fd;
}
/**
 * Read from the buffer.
 * @param fd The file descriptor for the buffer reader.
 * @param buffer The buffer to read into.
 * @returns The number of bytes read.
 */
export function readBuffer(fd, buffer) {
    const context = bufferContexts.get(fd);
    if (context == null) {
        return -1;
    }
    const [data, offset] = context;
    const length = Math.min(buffer.byteLength, data.byteLength - offset);
    buffer.set(data.slice(offset, offset + length));
    context[1] += length;
    return length;
}
/**
 * Close the buffer reader.
 * @param fd The file descriptor for the buffer reader.
 */
export function closeBuffer(fd) {
    bufferContexts.delete(fd);
}
export class XmlStringOutputBufferHandler {
    constructor() {
        this._result = '';
        this._decoder = new TextDecoder();
    }
    write(buf) {
        this._result += this._decoder.decode(buf);
        return buf.byteLength;
    }
    close() {
        return true;
    }
    get result() {
        return this._result;
    }
}
//# sourceMappingURL=utils.mjs.map