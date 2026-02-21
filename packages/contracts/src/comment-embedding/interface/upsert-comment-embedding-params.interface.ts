export interface UpsertCommentEmbeddingParamsInterface {
    readonly comment: string;
    readonly categoryId: number;
    readonly embedding: Uint8Array;
    readonly dimensions: number;
}
