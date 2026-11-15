import {
    AccountEntityTable,
    AccountTypeEnum,
    InstrumentTypeEnum,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    YieldKindEnum,
    YieldRepository
} from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { explainQueryPlan, seed, testDb, TestLayer } from '../../harness';

import type { YieldScopeInterface } from '@budgie/contracts';

const BASE_ID = 1;
const ALL: YieldScopeInterface = { positionAccountId: null, instrumentId: null };
const DAY = new Date(2026, 2, 10, 12, 0, 0);
const YIELD_INDEX_PLAN = /SEARCH transactions USING (COVERING )?INDEX transactions_yield_kind_idx/u;
const TRANSACTIONS_SCAN_PLAN = /SCAN transactions/u;

const seedYield = Effect.fnUntraced(function* (
    accountId: number,
    kind: YieldKindEnum | null,
    type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE = TransactionTypeEnum.INCOME,
    sourceAccountId: number | null = null
) {
    const transaction = yield* seed.manualExpense({ accountId, amount: 10 * PRECISION, operatedAt: DAY, type });

    yield* testDb
        .update(TransactionEntityTable)
        .set({ yieldKind: kind, yieldSourceAccountId: sourceAccountId })
        .where(eq(TransactionEntityTable.id, transaction.id));

    return transaction;
});

const findFacts = (baseInstrumentId: number = BASE_ID, scope: YieldScopeInterface = ALL) =>
    Effect.flatMap(YieldRepository, repository => repository.findFacts(scope, baseInstrumentId));

describe('yield/repository', () => {
    it.effect('reads the landing primary leg: INCOME debit positive, TAX credit, never NONE, untagged or fee legs', () =>
        Effect.gen(function* () {
            const cash = yield* seed.account({ type: AccountTypeEnum.CASH });
            const income = yield* seedYield(cash.id, YieldKindEnum.INTEREST);
            yield* seedYield(cash.id, YieldKindEnum.TAX, TransactionTypeEnum.EXPENSE);
            yield* seedYield(cash.id, YieldKindEnum.NONE);
            yield* seedYield(cash.id, null);
            yield* seed.feeEntry(income.id, null, { accountId: cash.id, amount: PRECISION });

            const facts = yield* findFacts();

            expect(facts.map(fact => [fact.transactionType, fact.yieldKind, fact.amount, fact.baseValue])).toEqual([
                [TransactionTypeEnum.INCOME, YieldKindEnum.INTEREST, 10 * PRECISION, 10 * PRECISION],
                [TransactionTypeEnum.EXPENSE, YieldKindEnum.TAX, 10 * PRECISION, 10 * PRECISION]
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('marks crypto and FUND rows estimated when the rate is unconfirmed or pending, never legacy fiat rows', () =>
        Effect.gen(function* () {
            const coin = yield* seed.instrument({ code: 'YLD1', name: 'Yield coin', symbol: 'YLD1', type: InstrumentTypeEnum.CRYPTO });
            const crypto = yield* seed.account({ type: AccountTypeEnum.CRYPTO_SYNC, instrumentId: coin.id });
            const cash = yield* seed.account({ type: AccountTypeEnum.CASH });
            const reward = yield* seedYield(crypto.id, YieldKindEnum.STAKING);
            const interest = yield* seedYield(cash.id, YieldKindEnum.INTEREST);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseExchangeRate: null })
                .where(eq(TransactionEntryEntityTable.transactionId, interest.id));

            expect((yield* findFacts()).map(fact => [fact.transactionId, fact.isEstimated])).toEqual([
                [reward.id, false],
                [interest.id, false]
            ]);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseExchangeRate: null })
                .where(eq(TransactionEntryEntityTable.transactionId, reward.id));

            expect((yield* findFacts()).map(fact => fact.isEstimated)).toEqual([true, false]);

            const otherBase = yield* seed.instrument({ code: 'YLD2', name: 'Other base', symbol: 'YLD2' });

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseInstrumentId: otherBase.id, baseExchangeRate: 1 })
                .where(eq(TransactionEntryEntityTable.transactionId, reward.id));

            expect((yield* findFacts()).map(fact => fact.isEstimated)).toEqual([true, false]);
            expect((yield* findFacts(otherBase.id)).map(fact => fact.isEstimated)).toEqual([false, false]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('excludes deleted, consolidated, deleted-leg and transfer rows', () =>
        Effect.gen(function* () {
            const cash = yield* seed.account({ type: AccountTypeEnum.CASH });
            const kept = yield* seedYield(cash.id, YieldKindEnum.INTEREST);
            const deleted = yield* seedYield(cash.id, YieldKindEnum.INTEREST);
            const consolidated = yield* seedYield(cash.id, YieldKindEnum.INTEREST);
            const deletedLeg = yield* seedYield(cash.id, YieldKindEnum.INTEREST);
            const transfer = yield* seedYield(cash.id, YieldKindEnum.INTEREST);

            yield* testDb.update(TransactionEntityTable).set({ deletedAt: DAY }).where(eq(TransactionEntityTable.id, deleted.id));
            yield* testDb
                .update(TransactionEntityTable)
                .set({ consolidationParentTransactionId: kept.id })
                .where(eq(TransactionEntityTable.id, consolidated.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ deletedAt: DAY })
                .where(eq(TransactionEntryEntityTable.transactionId, deletedLeg.id));
            yield* testDb
                .update(TransactionEntityTable)
                .set({ type: TransactionTypeEnum.TRANSFER })
                .where(eq(TransactionEntityTable.id, transfer.id));

            expect((yield* findFacts()).map(fact => fact.transactionId)).toEqual([kept.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts a non-base fiat reward through the confirmed exchange rate', () =>
        Effect.gen(function* () {
            const foreign = yield* seed.instrument({ code: 'YLD3', name: 'Foreign', symbol: 'YLD3' });
            const account = yield* seed.account({ type: AccountTypeEnum.CASH, instrumentId: foreign.id });
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const reward = yield* seedYield(account.id, YieldKindEnum.INTEREST);

            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: foreign.id, quoteInstrumentId: BASE_ID, rate: 2, source: 'test' }
            ]);
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ baseInstrumentId: null, baseExchangeRate: null, baseAmount: null })
                .where(eq(TransactionEntryEntityTable.transactionId, reward.id));

            expect((yield* findFacts()).map(fact => [fact.amount, fact.baseValue, fact.isEstimated])).toEqual([
                [10 * PRECISION, 20 * PRECISION, false]
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('attributes the source first, then a landing account that can hold a position, else Unassigned', () =>
        Effect.gen(function* () {
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const stocks = yield* seed.account({ type: AccountTypeEnum.STOCKS });
            const card = yield* seed.account({ type: AccountTypeEnum.BANK });

            yield* seedYield(card.id, YieldKindEnum.INTEREST, TransactionTypeEnum.INCOME, deposit.id);
            yield* seedYield(deposit.id, YieldKindEnum.INTEREST);
            yield* seedYield(stocks.id, YieldKindEnum.DIVIDEND);
            yield* seedYield(card.id, YieldKindEnum.INTEREST);

            expect((yield* findFacts()).map(fact => fact.positionAccountId)).toEqual([deposit.id, deposit.id, stocks.id, null]);
            expect((yield* findFacts(BASE_ID, { positionAccountId: deposit.id, instrumentId: null })).length).toBe(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('answers the global and scoped EXISTS probes', () =>
        Effect.gen(function* () {
            const repository = yield* YieldRepository;
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            const other = yield* seed.account({ type: AccountTypeEnum.SAVINGS });

            expect(yield* repository.hasYield).toBe(false);

            yield* seedYield(deposit.id, YieldKindEnum.NONE);
            expect(yield* repository.hasYield).toBe(false);

            yield* seedYield(deposit.id, YieldKindEnum.INTEREST);
            expect(yield* repository.hasYield).toBe(true);
            expect(yield* repository.hasYieldFor({ positionAccountId: deposit.id, instrumentId: null })).toBe(true);
            expect(yield* repository.hasYieldFor({ positionAccountId: other.id, instrumentId: null })).toBe(false);
            expect(yield* repository.hasYieldFor({ positionAccountId: null, instrumentId: deposit.instrumentId })).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('uses the transactions_yield_kind_idx index for hasYield, hasYieldFor and findFacts', () =>
        Effect.gen(function* () {
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            yield* seedYield(deposit.id, YieldKindEnum.INTEREST);

            const repository = yield* YieldRepository;
            const hasYieldPlan = yield* explainQueryPlan(repository.hasYield);
            const scopedPlan = yield* explainQueryPlan(repository.hasYieldFor({ positionAccountId: deposit.id, instrumentId: null }));
            const factsPlan = yield* explainQueryPlan(repository.findFacts(ALL, BASE_ID));

            for (const plan of [hasYieldPlan, scopedPlan, factsPlan]) {
                expect(plan.join('\n')).toMatch(YIELD_INDEX_PLAN);
                expect(plan.join('\n')).not.toMatch(TRANSACTIONS_SCAN_PLAN);
            }
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps interest rates out of the facts query', () =>
        Effect.gen(function* () {
            const deposit = yield* seed.account({ type: AccountTypeEnum.DEPOSIT });
            yield* testDb.update(AccountEntityTable).set({ interestRate: 12 }).where(eq(AccountEntityTable.id, deposit.id));

            expect(yield* findFacts()).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );
});
