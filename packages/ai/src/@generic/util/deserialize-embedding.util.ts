export const deserializeEmbedding = (buffer: ArrayBufferLike | Uint8Array): Float32Array => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

    return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / Float32Array.BYTES_PER_ELEMENT);
};
