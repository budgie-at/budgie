import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { MAX_TIME_BASED_SLOTS, TOTAL_SUGGESTION_SLOTS } from '../constant/repeated-transaction.constant';
import { PatternCategorySuggestion } from '../interface/pattern-category-suggestion.type';

const deduplicatePatternCategories = (patterns: RepeatedTransactionPatternInterface[]): PatternCategorySuggestion[] => {
    const categoryMap = new Map<number, PatternCategorySuggestion>();

    for (const { categoryId, categoryTitle, categoryIcon, occurrenceCount } of patterns) {
        if (occurrenceCount > (categoryMap.get(categoryId)?.occurrenceCount ?? -1)) {
            categoryMap.set(categoryId, { categoryId, categoryTitle, categoryIcon, occurrenceCount });
        }
    }

    return [...categoryMap.values()];
};

export const mergePatternCategories = (
    timePatterns: RepeatedTransactionPatternInterface[],
    amountPatterns: RepeatedTransactionPatternInterface[]
): PatternCategorySuggestion[] => {
    const timeCategories = deduplicatePatternCategories(timePatterns);
    const amountCategories = deduplicatePatternCategories(amountPatterns);
    const timeResult = timeCategories.slice(0, MAX_TIME_BASED_SLOTS);
    const usedCategoryIds = new Set(timeResult.map(category => category.categoryId));
    const amountResult: PatternCategorySuggestion[] = [];

    for (const category of amountCategories) {
        if (timeResult.length + amountResult.length >= TOTAL_SUGGESTION_SLOTS) {
            break;
        }

        if (!usedCategoryIds.has(category.categoryId)) {
            amountResult.push(category);
            usedCategoryIds.add(category.categoryId);
        }
    }

    for (const category of timeCategories.slice(MAX_TIME_BASED_SLOTS)) {
        if (timeResult.length + amountResult.length >= TOTAL_SUGGESTION_SLOTS) {
            break;
        }

        if (!usedCategoryIds.has(category.categoryId)) {
            timeResult.push(category);
            usedCategoryIds.add(category.categoryId);
        }
    }

    return [...amountResult, ...timeResult];
};
