export type AnalyticsTransactionsSearchParamsType = {
    readonly mode?: string | string[];
    readonly kind?: string | string[];
    readonly startDate?: string | string[];
    readonly endDate?: string | string[];
    readonly categoryId?: string | string[];
    readonly tagId?: string | string[];
    readonly type?: string | string[];
    readonly types?: string | string[];
    readonly accountIds?: string | string[];
    readonly categoryIds?: string | string[];
    readonly excludedCategoryIds?: string | string[];
    readonly tagIds?: string | string[];
    readonly amountFrom?: string | string[];
    readonly amountTo?: string | string[];
};
