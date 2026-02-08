import { EmbeddingPatternService } from '@budgie/ai';
import { PRECISION, RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { titleEmbeddingRepository, transactionPatternRepository } from '../../@generic/drizzle/db/db';
import {
    MINUTES_IN_DAY,
    MONTHLY_PATTERN_DAY_WINDOW,
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

interface MonthlyWindowInterface {
    readonly dayOfMonth: number;
    readonly dayWindowSize: number;
}

interface AmountBoundsInterface {
    readonly amountMin: number;
    readonly amountMax: number;
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

const calculateMonthlyWindow = (currentTime: Date): MonthlyWindowInterface => ({
    dayOfMonth: currentTime.getDate(),
    dayWindowSize: MONTHLY_PATTERN_DAY_WINDOW
});

const calculateAmountBounds = (amount: number): AmountBoundsInterface => ({
    amountMin: Math.round(amount * PRECISION * (1 - REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT)),
    amountMax: Math.round(amount * PRECISION * (1 + REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT))
});

const embeddingPatternService = new EmbeddingPatternService(titleEmbeddingRepository, transactionPatternRepository);

const EMBEDDING_CACHE_TTL_MS = 60_000;

interface EmbeddingCacheEntryInterface {
    readonly patterns: RepeatedTransactionPatternInterface[];
    readonly timestamp: number;
}

class RepeatedTransactionService {
    private readonly embeddingCache = new Map<string, EmbeddingCacheEntryInterface>();

    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const { currentTime, type, accountId, amount, categoryId } = params;
        const hasAmount = isPositiveNumber(amount);
        const timeWindow = calculateTimeWindow(currentTime, hasAmount);
        const monthlyWindow = calculateMonthlyWindow(currentTime);
        const amountBounds = hasAmount ? calculateAmountBounds(amount) : {};

        const [weeklyPatterns, monthlyPatterns, embeddingPatterns] = await Promise.all([
            transactionPatternRepository.findRepeatedPatterns({
                ...timeWindow,
                ...amountBounds,
                type,
                ...(isPositiveNumber(accountId) && { accountId }),
                ...(isPositiveNumber(categoryId) && { categoryId }),
                limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
            }),
            transactionPatternRepository.findMonthlyPatterns({
                ...monthlyWindow,
                ...amountBounds,
                type,
                ...(isPositiveNumber(accountId) && { accountId }),
                limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
            }),
            this.getEmbeddingPatterns(type, accountId, amountBounds)
        ]);

        return this.mergeAndDeduplicate(weeklyPatterns, monthlyPatterns, embeddingPatterns);
    }

    private async getEmbeddingPatterns(
        type: TransactionTypeEnum,
        accountId: number | undefined,
        amountBounds: AmountBoundsInterface | Record<string, never>
    ): Promise<RepeatedTransactionPatternInterface[]> {
        const cacheKey = `${type}-${String(accountId)}`;
        const cached = this.embeddingCache.get(cacheKey);
        const isCacheValid = isDefined(cached) && Date.now() - cached.timestamp < EMBEDDING_CACHE_TTL_MS;

        if (isCacheValid) {
            return cached.patterns;
        }

        try {
            const patterns = await embeddingPatternService.findSimilarPatterns({
                type,
                ...(isPositiveNumber(accountId) && { accountId }),
                ...amountBounds,
                limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
            });

            this.embeddingCache.set(cacheKey, { patterns, timestamp: Date.now() });

            return patterns;
        } catch {
            return [];
        }
    }

    private mergeAndDeduplicate(
        weeklyPatterns: RepeatedTransactionPatternInterface[],
        monthlyPatterns: RepeatedTransactionPatternInterface[],
        embeddingPatterns: RepeatedTransactionPatternInterface[]
    ): RepeatedTransactionPatternInterface[] {
        const patternMap = new Map<string, RepeatedTransactionPatternInterface>();

        for (const pattern of weeklyPatterns) {
            const key = `${pattern.categoryId}-${pattern.title}`;
            patternMap.set(key, pattern);
        }

        for (const pattern of [...monthlyPatterns, ...embeddingPatterns]) {
            const key = `${pattern.categoryId}-${pattern.title}`;
            const existing = patternMap.get(key);

            if (!existing || pattern.occurrenceCount > existing.occurrenceCount) {
                patternMap.set(key, pattern);
            }
        }

        return [...patternMap.values()]
            .sort((first, second) => second.occurrenceCount - first.occurrenceCount)
            .slice(0, REPEATED_TRANSACTION_DEFAULT_LIMIT);
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
