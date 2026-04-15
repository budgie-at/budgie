export interface BatchConfigInterface<TRawData, TContextData> {
    readonly fetchBatch: (limit: number, cursor?: number) => Promise<TRawData[]>;
    readonly buildContextData: (rows: TRawData[]) => TContextData[];
    readonly getContextKey: (item: TContextData) => string;
    readonly upsertEmbedding: (item: TContextData, serialized: Uint8Array, dimensions: number) => Promise<number | null>;
    readonly replaceTags: (embeddingId: number, tagIds: number[]) => Promise<void>;
    readonly getCursor: (batch: TRawData[]) => number;
}
