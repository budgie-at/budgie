import type { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface BuildAiSuggestionRowParamsInterface {
    readonly showTagSuggestions: boolean;
    readonly showRepeatedSuggestions: boolean;
    readonly showCategorySuggestions: boolean;
    readonly transactionTitle: string;
    readonly safeCategoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly transactionType: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectRepeatedPattern: (pattern: RepeatedTransactionPatternInterface) => void;
    readonly onSelectCategory: (categoryId: number) => void;
}
