import { TransferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { PRECISION, TransactionConsolidationTypeEnum, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    P2P_ONE_HOUR_MS,
    P2P_OPERATED_AT,
    P2P_OUT_OF_WINDOW_OFFSET_MS,
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    expectConsolidatedToP2pCanonical,
    expectP2pUnconsolidated,
    fetchCanonicalsOfType,
    fetchP2pCanonical,
    fetchTransactionById,
    seedBankPair,
    seedP2pFiatTransferFixture,
    seedP2pIncome,
    seedP2pPair,
    testDb,
    TestLayer
} from '../../harness';

const ONE_SECOND_MS = 1_000;
const TIED_COMBINATION_AMOUNTS = ['1000', '1500', '2500', '3000'].map(Number);
const CLOSER_INCOME_OFFSET_MS = 60_000;
const FARTHER_INCOME_OFFSET_MS = 120_000;
const FIRST_FIXED_POINT_EXPENSE_OFFSET_MS = 10_000;
const SECOND_FIXED_POINT_INCOME_OFFSET_MS = 11_000;
const SECOND_FIXED_POINT_EXPENSE_OFFSET_MS = 20_000;
const LARGE_P2P_QUOTE_AMOUNT = Number('25842') * PRECISION;
const SMALL_P2P_QUOTE_AMOUNT = Number('524') * PRECISION;
const LARGE_P2P_CRYPTO_AMOUNT = Number('585.91') * PRECISION;
const SMALL_P2P_CRYPTO_AMOUNT = Number('11.87') * PRECISION;

describe('consolidation/binance-p2p-fiat-transfer time window', () => {
    it.effect('accepts an expense exactly one hour away', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { expense, income } = seedP2pPair(
                { externalId: 'mono-uah-one-hour', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
                { externalId: 'binance:c2c:buy-one-hour', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
                P2P_ONE_HOUR_MS
            );

            expect(yield* transferConsolidationService.consolidate(null)).toEqual({ found: 1, consolidated: 1 });
            expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, binanceAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects an expense one second beyond the one-hour window', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { expense, income } = seedP2pPair(
                { externalId: 'mono-uah-one-hour-one-second', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
                { externalId: 'binance:c2c:buy-one-hour-one-second', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
                P2P_ONE_HOUR_MS + ONE_SECOND_MS
            );

            yield* expectP2pUnconsolidated([expense, income]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not consolidate a correctly-priced pair outside the time window', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            seedP2pPair(
                { externalId: 'mono-uah-late', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
                { externalId: 'binance:c2c:buy-late', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
                P2P_OUT_OF_WINDOW_OFFSET_MS
            );

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(0);
            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer ambiguity', () => {
    it.effect('rejects equal-best expense combinations for one Binance income', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const expenses = TIED_COMBINATION_AMOUNTS.map((amount, index) =>
                seedBankPair.expense(
                    { externalId: `mono-uah-combination-tie-${index}`, operatedAt: P2P_OPERATED_AT },
                    { accountId: bankAccount.id, amount: amount * PRECISION }
                )
            );
            const income = seedP2pIncome('binance:c2c:buy-combination-tie', binanceAccount.id);

            yield* expectP2pUnconsolidated([...expenses, income]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects equal ownership of one bank expense by two Binance incomes', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const expense = seedBankPair.expense(
                { externalId: 'mono-uah-overlap-tie', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );
            const incomes = ['first', 'second'].map(label =>
                seedBankPair.income(
                    {
                        externalId: `binance:c2c:buy-overlap-tie-${label}`,
                        operatedAt: new Date(P2P_OPERATED_AT.getTime() + FARTHER_INCOME_OFFSET_MS)
                    },
                    { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
                )
            );

            yield* expectP2pUnconsolidated([expense, ...incomes]);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer ranked ownership', () => {
    it.effect('uses provider fiat totals before considering grouped bank expenses', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { uah, bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const largeExpense = seedBankPair.expense(
                { externalId: 'mono-uah-authoritative-large', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: LARGE_P2P_QUOTE_AMOUNT }
            );
            const smallExpense = seedBankPair.expense(
                { externalId: 'mono-uah-authoritative-small', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: SMALL_P2P_QUOTE_AMOUNT }
            );
            const largeIncome = seedP2pIncome('binance:c2c:buy-authoritative-large', binanceAccount.id, {
                quotedInstrumentId: uah.id,
                quotedAmount: LARGE_P2P_QUOTE_AMOUNT,
                quotedUnitPrice: Number('44.1') * PRECISION
            });
            const smallIncome = seedP2pIncome('binance:c2c:buy-authoritative-small', binanceAccount.id, {
                quotedInstrumentId: uah.id,
                quotedAmount: SMALL_P2P_QUOTE_AMOUNT,
                quotedUnitPrice: Number('44.14') * PRECISION
            });

            testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: LARGE_P2P_CRYPTO_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, largeIncome.id))
                .run();
            testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: SMALL_P2P_CRYPTO_AMOUNT })
                .where(eq(TransactionEntryEntityTable.transactionId, smallIncome.id))
                .run();

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(2);
            expect(fetchTransactionById(largeExpense.id).consolidationParentTransactionId).toBe(
                fetchTransactionById(largeIncome.id).consolidationParentTransactionId
            );
            expect(fetchTransactionById(smallExpense.id).consolidationParentTransactionId).toBe(
                fetchTransactionById(smallIncome.id).consolidationParentTransactionId
            );
            expect(fetchTransactionById(largeIncome.id).consolidationParentTransactionId).not.toBe(
                fetchTransactionById(smallIncome.id).consolidationParentTransactionId
            );
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer ranked heuristic ownership', () => {
    it.effect('assigns an overlapping bank expense to its uniquely better Binance income', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const expense = seedBankPair.expense(
                { externalId: 'mono-uah-overlap-ranked', operatedAt: P2P_OPERATED_AT },
                { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );
            const closerIncome = seedBankPair.income(
                {
                    externalId: 'binance:c2c:buy-overlap-closer',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + CLOSER_INCOME_OFFSET_MS)
                },
                { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );
            const fartherIncome = seedBankPair.income(
                {
                    externalId: 'binance:c2c:buy-overlap-farther',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + FARTHER_INCOME_OFFSET_MS)
                },
                { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(1);

            const canonicalId = fetchP2pCanonical().id;
            expect(fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicalId);
            expect(fetchTransactionById(closerIncome.id).consolidationParentTransactionId).toBe(canonicalId);
            expect(fetchTransactionById(fartherIncome.id).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('resolves a newly exposed P2P pair in the same consolidation run', () =>
        Effect.gen(function* () {
            const transferConsolidationService = yield* TransferConsolidationService;
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const firstIncome = seedP2pIncome('binance:c2c:buy-fixed-point-a', binanceAccount.id);
            const secondIncome = seedBankPair.income(
                {
                    externalId: 'binance:c2c:buy-fixed-point-b',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + SECOND_FIXED_POINT_INCOME_OFFSET_MS)
                },
                { accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );
            const firstExpense = seedBankPair.expense(
                {
                    externalId: 'mono-uah-fixed-point-x',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + FIRST_FIXED_POINT_EXPENSE_OFFSET_MS)
                },
                { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );
            const secondExpense = seedBankPair.expense(
                {
                    externalId: 'mono-uah-fixed-point-y',
                    operatedAt: new Date(P2P_OPERATED_AT.getTime() + SECOND_FIXED_POINT_EXPENSE_OFFSET_MS)
                },
                { accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );

            expect((yield* transferConsolidationService.consolidate(null)).consolidated).toBe(2);
            expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(2);
            expect(fetchTransactionById(firstIncome.id).consolidationParentTransactionId).toBe(
                fetchTransactionById(secondExpense.id).consolidationParentTransactionId
            );
            expect(fetchTransactionById(secondIncome.id).consolidationParentTransactionId).toBe(
                fetchTransactionById(firstExpense.id).consolidationParentTransactionId
            );
            expect(fetchTransactionById(firstIncome.id).consolidationParentTransactionId).not.toBeNull();
            expect(fetchTransactionById(secondIncome.id).consolidationParentTransactionId).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
