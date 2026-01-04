export interface SuggestRuleDataInterface {
    readonly title: string;
    readonly comment: string | null;
    readonly mccCode: string | null;
    readonly categoryId: number | null;
    readonly tagIds: number[];
}
