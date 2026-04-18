export interface MerchantPendingContextInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
    readonly comment: string;
    readonly tagIds: number[];
    readonly transactionIds: number[];
    readonly existingEmbeddingId: number | null;
}
