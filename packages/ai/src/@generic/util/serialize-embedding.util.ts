export const serializeEmbedding = (embedding: Float32Array): Uint8Array =>
    new Uint8Array(embedding.buffer, embedding.byteOffset, embedding.byteLength);
