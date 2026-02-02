import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';

const TIME_WINDOW_MINUTES = 30;
const AMOUNT_TOLERANCE_PERCENT = 0.15;
const DEFAULT_LIMIT = 5;

interface GetSuggestionsParamsInterface {
    currentTime: Date;
    type: TransactionTypeEnum;
    accountId?: number;
    amount?: number;
    categoryId?: number;
}

class RepeatedTransactionService {
    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const { currentTime, type, accountId, amount, categoryId } = params;

        const weekday = currentTime.getDay();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const currentTimeMinutes = hours * 60 + minutes;

        const timeWindowStartMinutes = Math.max(0, currentTimeMinutes - TIME_WINDOW_MINUTES);
        const timeWindowEndMinutes = Math.min(24 * 60 - 1, currentTimeMinutes + TIME_WINDOW_MINUTES);

        const patterns = await transactionPatternRepository.findRepeatedPatterns({
            weekday,
            timeWindowStartMinutes,
            timeWindowEndMinutes,
            type,
            accountId,
            categoryId,
            limit: DEFAULT_LIMIT
        });

        if (amount !== undefined && amount > 0) {
            return this.filterByAmount(patterns, amount);
        }

        return patterns;
    }

    private filterByAmount(patterns: RepeatedTransactionPatternInterface[], targetAmount: number): RepeatedTransactionPatternInterface[] {
        const tolerance = targetAmount * AMOUNT_TOLERANCE_PERCENT;
        const minAmount = targetAmount - tolerance;
        const maxAmount = targetAmount + tolerance;

        return patterns.filter(pattern => pattern.averageAmount >= minAmount && pattern.averageAmount <= maxAmount);
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
