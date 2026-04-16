export interface UnembeddedMerchantDataInterface {
    readonly title: string;
    readonly mccDescription: string;
    readonly categoryId: number;
    readonly categoryTitleEn: string | null;
    readonly tagIds: string | null;
    readonly comment: string;
    readonly maxOperatedAt: number;
}
