import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import {
    MINUTES_IN_DAY,
    REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT,
    REPEATED_TRANSACTION_DEFAULT_LIMIT,
    REPEATED_TRANSACTION_TIME_WINDOW_MINUTES
} from '../constant/repeated-transaction.constant';
import { SuggestionsResultInterface } from '../interface/suggestions-result-interface.type';

interface GetSuggestionsParamsInterface {
    readonly currentTime: Date;
    readonly type: TransactionTypeEnum;
    readonly accountId?: number;
    readonly amount?: number;
    readonly categoryId?: number;
}

interface TimeWindowInterface {
    readonly weekday: number;
    readonly timeWindowStartMinutes: number;
    readonly timeWindowEndMinutes: number;
}

const calculateTimeWindow = (currentTime: Date): TimeWindowInterface => {
    const weekday = currentTime.getDay();
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

    return {
        weekday,
        timeWindowStartMinutes: Math.max(0, currentTimeMinutes - REPEATED_TRANSACTION_TIME_WINDOW_MINUTES),
        timeWindowEndMinutes: Math.min(MINUTES_IN_DAY, currentTimeMinutes + REPEATED_TRANSACTION_TIME_WINDOW_MINUTES)
    };
};

class RepeatedTransactionService {
    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<SuggestionsResultInterface> {
        const { currentTime, type, accountId, amount, categoryId } = params;
        const timeWindow = calculateTimeWindow(currentTime);

        const timeQuery = transactionPatternRepository.findRepeatedPatterns({
            ...timeWindow,
            type,
            ...(isPositiveNumber(accountId) && { accountId }),
            ...(isPositiveNumber(categoryId) && { categoryId }),
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        });

        const amountQuery = this.buildAmountQuery(type, amount, accountId, categoryId);

        const [timePatterns, amountPatterns] = await Promise.all([timeQuery, amountQuery]);

        return { timePatterns, amountPatterns };
    }

    getLatestAmount(patterns: RepeatedTransactionPatternInterface[], categoryId: number): number {
        let bestAmount = 0;
        let bestOccurrenceCount = 0;

        for (const pattern of patterns) {
            if (pattern.categoryId === categoryId && pattern.occurrenceCount > bestOccurrenceCount) {
                bestOccurrenceCount = pattern.occurrenceCount;
                bestAmount = pattern.latestAmount;
            }
        }

        return convertFromMicroUnits(bestAmount);
    }

    private buildAmountQuery(
        type: TransactionTypeEnum,
        amount: number | undefined,
        accountId: number | undefined,
        categoryId: number | undefined
    ): Promise<RepeatedTransactionPatternInterface[]> {
        if (!isPositiveNumber(amount)) {
            return Promise.resolve([]);
        }

        const amountMicroUnits = convertToMicroUnits(amount);
        const tolerance = amountMicroUnits * REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT;

        return transactionPatternRepository.findAmountBasedPatterns({
            type,
            amountMin: amountMicroUnits - tolerance,
            amountMax: amountMicroUnits + tolerance,
            ...(isPositiveNumber(accountId) && { accountId }),
            ...(isPositiveNumber(categoryId) && { categoryId }),
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        });
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
