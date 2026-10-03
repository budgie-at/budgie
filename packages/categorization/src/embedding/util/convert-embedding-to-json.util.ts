export const convertEmbeddingToJson = (embedding: Uint8Array): string =>
    JSON.stringify(Array.from(new Float32Array(embedding.buffer, embedding.byteOffset, embedding.byteLength / 4)));
