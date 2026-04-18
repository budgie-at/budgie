import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { aiLog } from '../../ai/utils/ai-log.util';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import {
    MINUTES_IN_DAY,
    REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT,
    REPEATED_TRANSACTION_DEFAULT_LIMIT,
    REPEATED_TRANSACTION_TIME_WINDOW_MINUTES
} from '../constant/repeated-transaction.constant';
import { SuggestionsResultInterface } from '../interface/suggestions-result.interface';

import { patternCacheService } from './pattern-cache/pattern-cache.service';

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

        const repeatedQuery = {
            ...timeWindow,
            type,
            ...(isPositiveNumber(accountId) && { accountId }),
            ...(isPositiveNumber(categoryId) && { categoryId }),
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        };
        const repeatedCacheKey = `repeated:${JSON.stringify(repeatedQuery)}`;
        const repeatedStart = Date.now();
        aiLog('service:repeated:memoize:start', { repeatedCacheKey });
        const timeQuery = patternCacheService.memoize(repeatedCacheKey, () => {
            aiLog('service:repeated:memoize:cache-miss', { repeatedCacheKey });
            return transactionPatternRepository.findRepeatedPatterns(repeatedQuery);
        });

        const amountQueryStart = Date.now();
        const amountQuery = this.buildAmountQuery(type, amount, accountId, categoryId);
        aiLog('service:repeated:amountQuery:start', { hasAmount: isPositiveNumber(amount), amount });

        const [timePatterns, amountPatterns] = await Promise.all([timeQuery, amountQuery]);
        aiLog('service:repeated:memoize:done', {
            repeatedCacheKey,
            timePatternCount: timePatterns.length,
            amountPatternCount: amountPatterns.length,
            repeatedDurationMs: Date.now() - repeatedStart,
            amountDurationMs: Date.now() - amountQueryStart
        });

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

        const amountQuery = {
            type,
            amountMin: amountMicroUnits - tolerance,
            amountMax: amountMicroUnits + tolerance,
            ...(isPositiveNumber(accountId) && { accountId }),
            ...(isPositiveNumber(categoryId) && { categoryId }),
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        };
        const amountCacheKey = `amount:${JSON.stringify(amountQuery)}`;
        const amountStart = Date.now();
        aiLog('service:repeated:amountCache:start', { amountCacheKey });

        return patternCacheService.memoize(amountCacheKey, () => {
            aiLog('service:repeated:amountCache:cache-miss', { amountCacheKey });
            return transactionPatternRepository.findAmountBasedPatterns(amountQuery).then(result => {
                aiLog('service:repeated:amountCache:done', {
                    amountCacheKey,
                    patternCount: result.length,
                    durationMs: Date.now() - amountStart
                });
                return result;
            });
        });
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
