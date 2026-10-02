import { LanguageEnum, RepeatedTransactionPatternInterface, TransactionPatternRepository, TransactionTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isPositiveNumber } from '@rnw-community/shared';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import {
    MINUTES_IN_DAY,
    REPEATED_TRANSACTION_AMOUNT_TOLERANCE_PERCENT,
    REPEATED_TRANSACTION_DEFAULT_LIMIT,
    REPEATED_TRANSACTION_TIME_WINDOW_MINUTES
} from '../constant/repeated-transaction.constant';

import { PatternCacheService } from './pattern-cache/pattern-cache.service';

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

export class RepeatedTransactionService extends Context.Service<RepeatedTransactionService>()('@budgie/app/RepeatedTransactionService', {
    make: Effect.gen(function* () {
        const transactionPatternRepository = yield* TransactionPatternRepository;
        const patternCacheService = yield* PatternCacheService;

        const buildAmountQuery = (params: GetSuggestionsParamsInterface) => {
            const { type, language, amount, accountId, categoryId } = params;

            if (!isPositiveNumber(amount)) {
                return Effect.succeed<RepeatedTransactionPatternInterface[]>([]);
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

            return patternCacheService.memoizeAmount(
                amountCacheKey,
                transactionPatternRepository.findAmountBasedPatterns(amountQuery, language)
            );
        };

        return {
            getSuggestions: Effect.fn('RepeatedTransactionService.getSuggestions')(function* (params: GetSuggestionsParamsInterface) {
                const { currentTime, type, language, accountId, categoryId } = params;
                const timeWindow = calculateTimeWindow(currentTime);

                const repeatedQuery = {
                    ...timeWindow,
                    type,
                    ...(isPositiveNumber(accountId) && { accountId }),
                    ...(isPositiveNumber(categoryId) && { categoryId }),
                    limit: REPEATED_TRANSACTION_DEFAULT_LIMIT
                };
                const repeatedCacheKey = `repeated:${language}:${JSON.stringify(repeatedQuery)}`;
                const timeQuery = patternCacheService.memoizeRepeated(
                    repeatedCacheKey,
                    transactionPatternRepository.findRepeatedPatterns(repeatedQuery, language)
                );

                const [timePatterns, amountPatterns] = yield* Effect.all([timeQuery, buildAmountQuery(params)], {
                    concurrency: 'unbounded'
                });

                return { timePatterns, amountPatterns };
            })
        };
    })
}) {
    static readonly layer = Layer.effect(RepeatedTransactionService, RepeatedTransactionService.make).pipe(
        Layer.provide([TransactionPatternRepository.layer, PatternCacheService.layer])
    );
}
