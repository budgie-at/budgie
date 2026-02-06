export const deserializeEmbedding = (buffer: Buffer): Float32Array =>
    new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Float32Array.BYTES_PER_ELEMENT);
