import { INVESTMENTS_CATEGORY_ID, PRECISION, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { InzhurNotSetUpError, InzhurSetupService, InzhurStatementInvalidError } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchBeforeTrackingCorrections } from '../../harness/inzhur/fetch-before-tracking-corrections';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import {
    CASH_AFTER_HISTORY,
    CONVERSION_AT,
    FULL_HISTORY_ROWS,
    OCEAN,
    REIT,
    TOP_UP_TYPE,
    UNKNOWN_TYPE
} from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurFundInstrument } from '../../harness/inzhur/seed-inzhur-fund-instrument';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';

const URI = 'operations.xlsx';
const REIT_CODE = 'INZHUR:REIT';
const REIT_PRICE = 10;

const layer = makeInzhurOperationsLayer({
    [URI]: buildInzhurOperationsWorkbook([...FULL_HISTORY_ROWS, { at: '2026-03-21T10:00:00', type: UNKNOWN_TYPE, credit: 1 }])
});

const setUpWithReitPrice = Effect.fnUntraced(function* (enteredCash: number) {
    const inzhurSetupService = yield* InzhurSetupService;

    yield* inzhurSetupService.setup(enteredCash);
    yield* seedInzhurFundInstrument(REIT_CODE, REIT);
    yield* seedInzhurPrice(REIT_CODE, CONVERSION_AT.slice(0, 10), REIT_PRICE);
});

describe('inzhur/operations-import', () => {
    it.effect('rebuilds the whole cash ledger from a full-history export', () =>
        Effect.gen(function* () {
            yield* setUpWithReitPrice(777);

            const summary = yield* importInzhurOperations(URI);
            const { cashAccount } = yield* requireInzhurSetup();
            const ocean = yield* requireInzhurFundByName(OCEAN);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(summary).toMatchObject({
                isFullHistory: true,
                periodFrom: '2026-01-10',
                periodTo: '2026-03-20',
                topUps: { count: 1, amount: 10_000 },
                withdrawals: { count: 1, amount: 500 },
                conversionCount: 1,
                surchargeAmount: 10,
                unrecognised: [{ operation: UNKNOWN_TYPE, count: 1 }],
                bankMatches: { paired: 0, unpaired: 2 },
                cashBalance: CASH_AFTER_HISTORY
            });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(yield* fetchAccountBalance(ocean.id)).toBe(0);
            expect(yield* fetchAccountBalance(reit.id)).toBe(480 * PRECISION);
            expect(yield* fetchBeforeTrackingCorrections).toEqual([]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('records every operation type with the exact cost basis', () =>
        Effect.gen(function* () {
            yield* setUpWithReitPrice(0);
            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();
            const ocean = yield* requireInzhurFundByName(OCEAN);
            const reit = yield* requireInzhurFundByName(REIT);
            const ledger = yield* fetchInzhurOperationsLedger;
            const titled = (title: string) => ledger.filter(transaction => transaction.title === title);

            expect(ledger.map(({ type }) => type).filter(type => type === TransactionTypeEnum.TRANSFER)).toHaveLength(7);
            expect(titled('Bought Ocean')[0].entries).toEqual([
                { accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 4000 * PRECISION, categoryId: null },
                { accountId: ocean.id, type: TransactionEntryTypeEnum.DEBIT, amount: 100 * PRECISION, categoryId: null }
            ]);
            expect(titled('Bought REIT').map(({ entries }) => entries[0].amount)).toEqual([10, 490, 4300].map(value => value * PRECISION));
            expect(titled('Sold Ocean')[0].entries.map(({ amount }) => amount)).toEqual([100 * PRECISION, 4300 * PRECISION]);
            expect(titled('Ocean dividends')[0]).toMatchObject({
                type: TransactionTypeEnum.INCOME,
                fundAccountId: ocean.id,
                entries: [
                    {
                        accountId: cashAccount.id,
                        type: TransactionEntryTypeEnum.DEBIT,
                        amount: 200 * PRECISION,
                        categoryId: INVESTMENTS_CATEGORY_ID
                    }
                ]
            });
            expect(titled('Ocean dividend tax')[0]).toMatchObject({
                type: TransactionTypeEnum.EXPENSE,
                fundAccountId: ocean.id,
                entries: [{ accountId: cashAccount.id, type: TransactionEntryTypeEnum.CREDIT, amount: 36 * PRECISION, categoryId: 31 }]
            });
            expect(titled('Top-up to Inzhur')[0]).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: null,
                toAccountId: cashAccount.id
            });
            expect(titled('Withdrawal from Inzhur')[0]).toMatchObject({
                type: TransactionTypeEnum.TRANSFER,
                fromAccountId: cashAccount.id,
                toAccountId: null
            });
            expect(reit.id).not.toBe(ocean.id);
        }).pipe(Effect.provide(layer))
    );

    it.effect('estimates the converted quantity from the price and says so, folding the surcharge into the cost', () =>
        Effect.gen(function* () {
            yield* setUpWithReitPrice(0);

            const summary = yield* importInzhurOperations(URI);

            expect(summary.funds.find(fund => fund.name === REIT)).toMatchObject({
                boughtQuantity: 480,
                boughtAmount: 4800,
                isQuantityEstimated: true
            });
            expect(summary.funds.find(fund => fund.name === OCEAN)).toMatchObject({
                boughtQuantity: 100,
                soldQuantity: 100,
                soldAmount: 4300,
                dividends: 200,
                tax: 36,
                isQuantityEstimated: false
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('fails with a typed error for a non-Inzhur file and when Inzhur is not set up', () =>
        Effect.gen(function* () {
            const notSetUp = yield* Effect.flip(importInzhurOperations(URI));

            expect(notSetUp).toBeInstanceOf(InzhurNotSetUpError);

            const inzhurSetupService = yield* InzhurSetupService;

            yield* inzhurSetupService.setup(0);

            expect(yield* Effect.flip(importInzhurOperations('garbage.xlsx'))).toBeInstanceOf(InzhurStatementInvalidError);
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
                    'garbage.xlsx': new Uint8Array([1, 2, 3])
                })
            )
        )
    );

    it.effect('reads Kyiv summer time and records sells by their quantity', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;

            yield* inzhurSetupService.setup(0);
            yield* importInzhurOperations('summer.xlsx');

            const reit = yield* requireInzhurFundByName(REIT);
            const ledger = yield* fetchInzhurOperationsLedger;

            expect(ledger.map(({ title, operatedAt }) => [title, operatedAt.toISOString()])).toEqual([
                ['Top-up to Inzhur', '2026-07-01T09:00:00.000Z'],
                ['Bought REIT', '2026-07-01T09:30:00.000Z'],
                ['Sold REIT', '2026-07-02T10:00:00.000Z']
            ]);
            expect(yield* fetchAccountBalance(reit.id)).toBe(2 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    'summer.xlsx': buildInzhurOperationsWorkbook([
                        { at: '2026-07-01T12:00:00', type: TOP_UP_TYPE, debit: 100 },
                        { at: '2026-07-01T12:30:00', type: 'Купівля 3 сертифікати', fund: REIT, credit: 30 },
                        { at: '2026-07-02T13:00:00', type: 'Продаж 1 сертифікату', fund: REIT, debit: 11 }
                    ])
                })
            )
        )
    );

    it.effect('classifies an export as full when cash only dips within a day', () =>
        Effect.gen(function* () {
            const inzhurSetupService = yield* InzhurSetupService;

            yield* inzhurSetupService.setup(0);

            const summary = yield* importInzhurOperations('dip.xlsx');

            expect(summary).toMatchObject({ isFullHistory: true, cashBalance: 20 });
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    'dip.xlsx': buildInzhurOperationsWorkbook([
                        { at: '2026-02-01T09:00:00', type: TOP_UP_TYPE, debit: 100 },
                        { at: '2026-02-02T10:00:00', type: 'Купівля 13 сертифікатів', fund: REIT, credit: 130 },
                        { at: '2026-02-02T10:05:00', type: TOP_UP_TYPE, debit: 50 }
                    ])
                })
            )
        )
    );
});
