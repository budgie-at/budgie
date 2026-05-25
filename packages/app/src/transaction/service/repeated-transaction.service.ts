import { LanguageEnum, RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
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
    readonly language: LanguageEnum;
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
    @Log(
        params =>
            `enter type=${params.type} accountId=${params.accountId ?? 0} amount=${params.amount ?? 0} categoryId=${params.categoryId ?? 0}`,
        (result, params) =>
            `done type=${params.type} accountId=${params.accountId ?? 0} timeCategoryIds=${result.timePatterns.map(pattern => pattern.categoryId).join(',')} amountCategoryIds=${result.amountPatterns.map(pattern => pattern.categoryId).join(',')}`,
        (error, params) =>
            `throw type=${params.type} accountId=${params.accountId ?? 0} amount=${params.amount ?? 0} error=${getErrorMessage(error)}`
    )
    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<SuggestionsResultInterface> {
        const { currentTime, type, language, accountId, amount, categoryId } = params;
        const timeWindow = calculateTimeWindow(currentTime);

        const repeatedQuery = {
            ...timeWindow,
            type,
            ...(isPositiveNumber(accountId) && { accountId }),
            ...(isPositiveNumber(categoryId) && { categoryId }),
            limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
        };
        const repeatedCacheKey = `repeated:${language}:${JSON.stringify(repeatedQuery)}`;
        const timeQuery = patternCacheService.memoizeRepeated(repeatedCacheKey, () =>
            transactionPatternRepository.findRepeatedPatterns(repeatedQuery, language)
        );

        const amountQuery = this.buildAmountQuery(type, language, amount, accountId, categoryId);

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

    // eslint-disable-next-line @typescript-eslint/max-params -- positional args preserved per CLAUDE.md rule 33
    private buildAmountQuery(
        type: TransactionTypeEnum,
        language: LanguageEnum,
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
        const amountCacheKey = `amount:${language}:${JSON.stringify(amountQuery)}`;

        return patternCacheService.memoizeAmount(amountCacheKey, () =>
            transactionPatternRepository.findAmountBasedPatterns(amountQuery, language)
        );
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
