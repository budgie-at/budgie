import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { MAX_TIME_BASED_SLOTS, TOTAL_SUGGESTION_SLOTS } from '../constant/repeated-transaction.constant';
import { PatternCategorySuggestion } from '../interface/pattern-category-suggestion.type';

import { deduplicatePatternCategories } from './deduplicate-pattern-categories.util';

export const mergePatternCategories = (
    timePatterns: RepeatedTransactionPatternInterface[],
    amountPatterns: RepeatedTransactionPatternInterface[]
): PatternCategorySuggestion[] => {
    const timeCategories = deduplicatePatternCategories(timePatterns);
    const amountCategories = deduplicatePatternCategories(amountPatterns);

    const timeResult: PatternCategorySuggestion[] = [];
    const amountResult: PatternCategorySuggestion[] = [];
    const usedCategoryIds = new Set<number>();

    const timeSlotCount = Math.min(timeCategories.length, MAX_TIME_BASED_SLOTS);
    for (let index = 0; index < timeSlotCount; index += 1) {
        timeResult.push(timeCategories[index]);
        usedCategoryIds.add(timeCategories[index].categoryId);
    }

    for (const category of amountCategories) {
        if (timeResult.length + amountResult.length >= TOTAL_SUGGESTION_SLOTS) {
            break;
        }

        if (!usedCategoryIds.has(category.categoryId)) {
            amountResult.push(category);
            usedCategoryIds.add(category.categoryId);
        }
    }

    for (let index = timeSlotCount; index < timeCategories.length; index += 1) {
        if (timeResult.length + amountResult.length >= TOTAL_SUGGESTION_SLOTS) {
            break;
        }

        if (!usedCategoryIds.has(timeCategories[index].categoryId)) {
            timeResult.push(timeCategories[index]);
            usedCategoryIds.add(timeCategories[index].categoryId);
        }
    }

    return [...amountResult, ...timeResult];
};
