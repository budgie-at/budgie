import { makeTestPlatformLayer } from '@budgie-at/test-kit';
import {
    AccountTypeEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    YieldKindEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { YieldRangeEnum } from '../src/yield/enum/yield-range.enum';
import { YieldService } from '../src/yield/service/yield.service';

import { testDb, testSeedService } from './test-context';

const TRANSACTION_COUNT = 100_000;
const YIELD_EVERY = 20;
const BATCH_SIZE = 500;
const HISTORY_DAYS = 730;
const MS_PER_DAY = 86_400_000;
const WARMUP_RUNS = 2;
const TIMED_RUNS = 10;
const BUDGET_MS = 30;
const BENCH_TIMEOUT_MS = 600_000;
const BASE_INSTRUMENT_ID = 1;

const BenchLayer = YieldService.layer.pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));

const seedBatch = Effect.fnUntraced(function* (start: number, cashId: number, depositId: number) {
    const now = Date.now();
    const transactions = yield* testDb
        .insert(TransactionEntityTable)
        .values(
            Array.from({ length: BATCH_SIZE }, (_, offset) => {
                const isYield = (start + offset) % YIELD_EVERY === 0;

                return {
                    type: isYield ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
                    title: '',
                    externalId: null,
                    externalSource: null,
                    operatedAt: new Date(now - ((start + offset) % HISTORY_DAYS) * MS_PER_DAY),
                    exchangeRate: 1,
                    fromAccountId: isYield ? null : cashId,
                    toAccountId: isYield ? depositId : null,
                    comment: '',
                    updatedBy: null,
                    yieldKind: isYield ? YieldKindEnum.INTEREST : null,
                    yieldSourceAccountId: null
                };
            })
        )
        .returning({ id: TransactionEntityTable.id, type: TransactionEntityTable.type });

    yield* testDb.insert(TransactionEntryEntityTable).values(
        transactions.map(transaction => {
            const isIncome = transaction.type === TransactionTypeEnum.INCOME;

            return {
                transactionId: transaction.id,
                accountId: isIncome ? depositId : cashId,
                type: isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
                amount: PRECISION,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: BASE_INSTRUMENT_ID,
                baseExchangeRate: 1,
                baseAmount: PRECISION,
                toIban: null,
                categoryId: null,
                mccCategoryId: null,
                originalTransactionId: null
            };
        })
    );
});

describe('yield bench', () => {
    it.live(
        'summarizes 5k yield rows among 100k transactions within 30 ms (median)',
        () =>
            Effect.gen(function* () {
                const cash = yield* testSeedService.account({ type: AccountTypeEnum.CASH });
                const deposit = yield* testSeedService.account({ type: AccountTypeEnum.DEPOSIT });

                yield* Effect.forEach(
                    Array.from({ length: TRANSACTION_COUNT / BATCH_SIZE }, (_, index) => index * BATCH_SIZE),
                    start => seedBatch(start, cash.id, deposit.id),
                    { discard: true }
                );

                const service = yield* YieldService;
                const key = {
                    range: YieldRangeEnum.YEAR,
                    positionAccountId: null,
                    instrumentId: null,
                    group: null,
                    baseInstrumentId: BASE_INSTRUMENT_ID
                };
                const timeOnce = Effect.gen(function* () {
                    const startedAt = performance.now();

                    yield* service.summarize(key);

                    return performance.now() - startedAt;
                });

                yield* Effect.forEach(Array.from({ length: WARMUP_RUNS }), () => timeOnce, { discard: true });

                const timings = yield* Effect.forEach(Array.from({ length: TIMED_RUNS }), () => timeOnce);
                const median = [...timings].sort((left, right) => left - right).at(Math.floor(TIMED_RUNS / 2)) ?? Number.POSITIVE_INFINITY;

                expect(median, `median ${median.toFixed(1)} ms over ${TIMED_RUNS} runs`).toBeLessThan(BUDGET_MS);
            }).pipe(Effect.provide(BenchLayer)),
        BENCH_TIMEOUT_MS
    );
});
