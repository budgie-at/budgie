import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import { transactionPatternRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
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
    amountMin: convertToMicroUnits(amount * (1 - REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT)),
    amountMax: convertToMicroUnits(amount * (1 + REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT))
});

const AMOUNT_SCORE_BASE_WEIGHT = 0.3;
const AMOUNT_SCORE_PROXIMITY_WEIGHT = 0.7;

class RepeatedTransactionService {
    // eslint-disable-next-line max-statements -- Debug logging
    async getSuggestions(params: GetSuggestionsParamsInterface): Promise<RepeatedTransactionPatternInterface[]> {
        const start = performance.now();
        const { currentTime, type, accountId, amount, categoryId } = params;
        const hasAmount = isPositiveNumber(amount);
        const timeWindow = calculateTimeWindow(currentTime, hasAmount);
        const monthlyWindow = calculateMonthlyWindow(currentTime);
        const amountBounds = hasAmount ? calculateAmountBounds(amount) : {};
        /* eslint-disable no-console, lingui/no-unlocalized-strings */
        console.log(
            `[RepeatSvc] params: day=${timeWindow.weekday} time=${timeWindow.timeWindowStartMinutes}-${timeWindow.timeWindowEndMinutes} dom=${monthlyWindow.dayOfMonth} type=${type} acct=${String(accountId)} amt=${String(amount)} cat=${String(categoryId)}`
        );
        /* eslint-enable no-console, lingui/no-unlocalized-strings */

        const [weeklyPatterns, monthlyPatterns, frequentPatterns] = await Promise.all([
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
            transactionPatternRepository.findFrequentPatterns({
                type,
                limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
            })
        ]);
        /* eslint-disable no-console, lingui/no-unlocalized-strings */
        const logPattern = (pt: RepeatedTransactionPatternInterface): string => `${pt.title}(cat=${pt.categoryId},n=${pt.occurrenceCount})`;
        console.log(
            `[RepeatSvc] in ${(performance.now() - start).toFixed(0)}ms w=${weeklyPatterns.length} m=${monthlyPatterns.length} f=${frequentPatterns.length}`
        );
        if (weeklyPatterns.length > 0) {
            console.log(`[RepeatSvc] weekly: ${weeklyPatterns.map(logPattern).join(', ')}`);
        }
        if (monthlyPatterns.length > 0) {
            console.log(`[RepeatSvc] monthly: ${monthlyPatterns.map(logPattern).join(', ')}`);
        }
        if (frequentPatterns.length > 0) {
            console.log(`[RepeatSvc] frequent: ${frequentPatterns.map(logPattern).join(', ')}`);
        }
        /* eslint-enable no-console, lingui/no-unlocalized-strings */

        const amountInMicroUnits = hasAmount ? convertToMicroUnits(amount) : 0;
        const merged = this.mergeAndDeduplicate(weeklyPatterns, monthlyPatterns, frequentPatterns, amountInMicroUnits);
        // eslint-disable-next-line no-console, lingui/no-unlocalized-strings
        console.log(`[RepeatSvc] merged: ${merged.map(logPattern).join(', ')}`);

        return merged;
    }

    private mergeAndDeduplicate(
        weeklyPatterns: RepeatedTransactionPatternInterface[],
        monthlyPatterns: RepeatedTransactionPatternInterface[],
        frequentPatterns: RepeatedTransactionPatternInterface[],
        amountInMicroUnits: number
    ): RepeatedTransactionPatternInterface[] {
        const patternMap = new Map<string, RepeatedTransactionPatternInterface>();

        for (const pattern of weeklyPatterns) {
            const key = `${pattern.categoryId}-${pattern.title}`;
            patternMap.set(key, pattern);
        }

        for (const pattern of [...monthlyPatterns, ...frequentPatterns]) {
            const key = `${pattern.categoryId}-${pattern.title}`;
            const existing = patternMap.get(key);

            if (!existing || pattern.occurrenceCount > existing.occurrenceCount) {
                patternMap.set(key, pattern);
            }
        }

        const hasAmount = isPositiveNumber(amountInMicroUnits);

        return [...patternMap.values()]
            .sort((first, second) => {
                const firstScore = this.calculatePatternScore(first, amountInMicroUnits, hasAmount);
                const secondScore = this.calculatePatternScore(second, amountInMicroUnits, hasAmount);

                return secondScore - firstScore;
            })
            .slice(0, REPEATED_TRANSACTION_DEFAULT_LIMIT);
    }

    private calculatePatternScore(pattern: RepeatedTransactionPatternInterface, amountInMicroUnits: number, hasAmount: boolean): number {
        if (!hasAmount) {
            return pattern.occurrenceCount;
        }

        const amountRatio = Math.min(pattern.averageAmount, amountInMicroUnits) / Math.max(pattern.averageAmount, amountInMicroUnits);

        return pattern.occurrenceCount * (AMOUNT_SCORE_BASE_WEIGHT + AMOUNT_SCORE_PROXIMITY_WEIGHT * amountRatio);
    }
}

export const repeatedTransactionService = new RepeatedTransactionService();
