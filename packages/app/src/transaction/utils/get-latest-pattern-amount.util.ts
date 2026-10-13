import { RepeatedTransactionPatternInterface, convertFromMicroUnits } from '@budgie/contracts';

export const getLatestPatternAmount = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): number => {
    let bestAmount = 0;
    let bestOccurrenceCount = 0;

    for (const pattern of patterns) {
        if (pattern.categoryId === categoryId && pattern.occurrenceCount > bestOccurrenceCount) {
            bestOccurrenceCount = pattern.occurrenceCount;
            bestAmount = pattern.latestAmount;
        }
    }

    return convertFromMicroUnits(bestAmount);
};
