export const serializeEmbedding = (embedding: Float32Array): Buffer =>
    Buffer.from(embedding.buffer, embedding.byteOffset, embedding.byteLength);
