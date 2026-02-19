import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { PatternCategorySuggestion } from '../interface/pattern-category-suggestion.type';

export const deduplicatePatternCategories = (patterns: RepeatedTransactionPatternInterface[]): PatternCategorySuggestion[] => {
    const categoryMap = new Map<number, PatternCategorySuggestion>();

    for (const pattern of patterns) {
        const existing = categoryMap.get(pattern.categoryId);

        if (!existing || pattern.occurrenceCount > existing.occurrenceCount) {
            categoryMap.set(pattern.categoryId, {
                categoryId: pattern.categoryId,
                categoryTitle: pattern.categoryTitle,
                categoryIcon: pattern.categoryIcon,
                occurrenceCount: pattern.occurrenceCount
            });
        }
    }

    return [...categoryMap.values()];
};
