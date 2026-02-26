export interface UpsertMerchantEmbeddingParamsInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly categoryId: number;
    readonly comment: string;
    readonly embedding: Uint8Array;
    readonly dimensions: number;
}
