export interface PendingContextBaseRowInterface {
    readonly transactionIdsCsv: string;
    readonly tagIdsCsv: string | null;
    readonly existingEmbeddingId: number | null;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
}
