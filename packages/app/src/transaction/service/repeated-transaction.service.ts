import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';

const TIME_WINDOW_MINUTES = 30;
const AMOUNT_BASED_TIME_WINDOW_MINUTES = 180;
const AMOUNT_TOLERANCE_PERCENT = 0.15;
const DEFAULT_LIMIT = 5;
const MINUTES_IN_DAY = 24 * 60 - 1;

interface GetSuggestionsParamsInterface {
    currentTime: Date;
    type: TransactionTypeEnum;
    accountId?: number;
    amount?: number;
    categoryId?: number;
}

interface TimeWindowInterface {
    weekday: number;
    timeWindowStartMinutes: number;
    timeWindowEndMinutes: number;
}

const calculateTimeWindow = (currentTime: Date, hasAmount: boolean): TimeWindowInterface => {
    const weekday = currentTime.getDay();
    const currentTimeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const timeWindow = hasAmount ? AMOUNT_BASED_TIME_WINDOW_MINUTES : TIME_WINDOW_MINUTES;

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
            limit: DEFAULT_LIMIT
        });

        return hasAmount ? this.filterByAmount(patterns, amount) : patterns;
    }

    private filterByAmount(patterns: RepeatedTransactionPatternInterface[], targetAmount: number): RepeatedTransactionPatternInterface[] {
        const tolerance = targetAmount * AMOUNT_TOLERANCE_PERCENT;
        const minAmount = targetAmount - tolerance;
        const maxAmount = targetAmount + tolerance;

        return patterns.filter(pattern => pattern.averageAmount >= minAmount && pattern.averageAmount <= maxAmount);
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
