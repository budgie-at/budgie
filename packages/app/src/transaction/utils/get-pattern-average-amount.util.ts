import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const getPatternAverageAmount = (patterns: RepeatedTransactionPatternInterface[], categoryId: number): number => {
    let bestAmount = 0;
    let bestOccurrenceCount = 0;

    for (const pattern of patterns) {
        if (pattern.categoryId === categoryId && pattern.occurrenceCount > bestOccurrenceCount) {
            bestOccurrenceCount = pattern.occurrenceCount;
            bestAmount = pattern.averageAmount;
        }
    }

    return convertFromMicroUnits(bestAmount);
};
