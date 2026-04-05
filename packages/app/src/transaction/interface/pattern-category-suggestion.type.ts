import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

export type PatternCategorySuggestion = Pick<
    RepeatedTransactionPatternInterface,
    'categoryId' | 'categoryTitle' | 'categoryIcon' | 'occurrenceCount'
>;
