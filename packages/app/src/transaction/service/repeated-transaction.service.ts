import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import {
    MINUTES_IN_DAY,
    REPEATED_TRANSACTION_AMOUNT_BASED_TIME_WINDOW_MINUTES,
    REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT,
    REPEATED_TRANSACTION_DEFAULT_LIMIT,
    REPEATED_TRANSACTION_TIME_WINDOW_MINUTES
} from '../constant/repeated-transaction.constant';

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

const calculateTimeWindow = (currentTime: Date, hasAmount: boolean): TimeWindowInterface => {
    const weekday = currentTime.getDay();
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const timeWindow = hasAmount ? REPEATED_TRANSACTION_AMOUNT_BASED_TIME_WINDOW_MINUTES : REPEATED_TRANSACTION_TIME_WINDOW_MINUTES;

    return {
        weekday,
        timeWindowStartMinutes: Math.max(0, currentTimeMinutes - timeWindow),
        timeWindowEndMinutes: Math.min(MINUTES_IN_DAY, currentTimeMinutes + timeWindow)
    };
};

class RepeatedTransactionService {
    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const { currentTime, type, accountId, amount, categoryId } = params;
        const hasAmount = isPositiveNumber(amount);
        const timeWindow = calculateTimeWindow(currentTime, hasAmount);

        const patterns = await transactionPatternRepository.findRepeatedPatterns({
            ...timeWindow,
            type,
            accountId,
            categoryId,
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        });

        return hasAmount ? this.filterByAmount(patterns, amount) : patterns;
    }

    private filterByAmount(patterns: RepeatedTransactionPatternInterface[], targetAmount: number): RepeatedTransactionPatternInterface[] {
        const tolerance = targetAmount * REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT;
        const minAmount = targetAmount - tolerance;
        const maxAmount = targetAmount + tolerance;

        return patterns.filter(pattern => pattern.averageAmount >= minAmount && pattern.averageAmount <= maxAmount);
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
