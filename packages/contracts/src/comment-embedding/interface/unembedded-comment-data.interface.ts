export interface UnembeddedCommentDataInterface {
    readonly comment: string;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
    readonly tagIds: string | null;
    readonly maxOperatedAt: number;
}
