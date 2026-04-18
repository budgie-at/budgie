export interface CommentPendingContextInterface {
    readonly comment: string;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
    readonly tagIds: number[];
    readonly transactionIds: number[];
    readonly existingEmbeddingId: number | null;
}
