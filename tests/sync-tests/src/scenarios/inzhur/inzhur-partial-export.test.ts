import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchBeforeExportAdjustments } from '../../harness/inzhur/fetch-before-export-adjustments';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { DIVIDEND_TYPE, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';

const PARTIAL_URI = 'partial.xlsx';
const LATER_URI = 'later.xlsx';
const FULL_URI = 'full.xlsx';
const EARLIER_URI = 'earlier.xlsx';
const PARTIAL_ROWS = [
    { at: '2026-02-01T10:00:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
    { at: '2026-02-02T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 50 }
];

const layer = makeInzhurOperationsLayer({
    [LATER_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-03-01T10:00:00', type: TOP_UP_TYPE, debit: 500 },
        { at: '2026-03-01T10:05:00', type: 'Купівля 50 сертифікатів', fund: REIT, credit: 500 }
    ]),
    [PARTIAL_URI]: buildInzhurOperationsWorkbook(PARTIAL_ROWS),
    [EARLIER_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-01-20T10:00:00', type: 'Купівля 20 сертифікатів', fund: REIT, credit: 200 },
        ...PARTIAL_ROWS
    ]),
    [FULL_URI]: buildInzhurOperationsWorkbook([{ at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 1000 }, ...PARTIAL_ROWS])
});

describe('inzhur/partial-export', () => {
    it.effect('lifts the cash before a partial export just enough to keep every day end non-negative', () =>
        Effect.gen(function* () {
            const summary = yield* importInzhurOperations(PARTIAL_URI);
            const { cashAccount } = yield* requireInzhurSetup();

            expect(summary).toMatchObject({ isFullHistory: false, cashBalance: 50 });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(50 * PRECISION);
            expect(yield* fetchBeforeExportAdjustments).toMatchObject([
                {
                    title: 'Balance before export',
                    operatedAt: new Date('2026-02-01T07:59:59.000Z'),
                    entries: [{ accountId: cashAccount.id, amount: 100 * PRECISION }]
                }
            ]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('removes the adjustment once an export from the beginning of the history is imported', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations(PARTIAL_URI);

            const summary = yield* importInzhurOperations(FULL_URI);
            const { cashAccount } = yield* requireInzhurSetup();

            expect(summary).toMatchObject({ isFullHistory: true, alreadyImportedCount: 2, recordedCount: 1 });
            expect(yield* fetchBeforeExportAdjustments).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(950 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('recomputes the cash floor at the earlier start when a later export reaches further back', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations(PARTIAL_URI);
            yield* importInzhurOperations(EARLIER_URI);

            const { cashAccount } = yield* requireInzhurSetup();

            expect(yield* fetchBeforeExportAdjustments).toMatchObject([
                {
                    operatedAt: new Date('2026-01-20T07:59:59.000Z'),
                    entries: [{ accountId: cashAccount.id, amount: 300 * PRECISION }]
                }
            ]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(50 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps an existing cash floor when a later file starts with a top-up', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations(PARTIAL_URI);
            yield* importInzhurOperations(LATER_URI);
            yield* importInzhurOperations(PARTIAL_URI);

            const { cashAccount } = yield* requireInzhurSetup();

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(50 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect.each([
        { uri: PARTIAL_URI, balance: 50 },
        { uri: LATER_URI, balance: 0 }
    ])('offsets pre-export bank cash for $uri', ({ uri, balance }) =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* importInzhurBankFlow(bankAccount.id, 'early-top-up', TOP_UP_DESCRIPTION, -1000, new Date('2026-01-05T08:00:00.000Z'));
            yield* importInzhurOperations(uri);

            const { cashAccount } = yield* requireInzhurSetup();

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(balance * PRECISION);
        }).pipe(Effect.provide(layer))
    );
});
