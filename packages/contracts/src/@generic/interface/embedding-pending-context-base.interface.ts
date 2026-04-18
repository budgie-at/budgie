export interface EmbeddingPendingContextBaseInterface {
    readonly transactionIds: number[];
    readonly tagIds: number[];
    readonly existingEmbeddingId: number | null;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
}
