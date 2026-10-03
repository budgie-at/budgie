export interface SuggestRuleDataInterface {
    readonly title: string;
    readonly comment: string;
    readonly mccCode: string | null;
    readonly categoryId: number | null;
    readonly tagIds: number[];
}
