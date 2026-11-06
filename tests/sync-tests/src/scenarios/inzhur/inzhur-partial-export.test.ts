import { PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { fetchBeforeExportAdjustments } from '../../harness/inzhur/fetch-before-export-adjustments';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { DIVIDEND_TYPE, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';

const PARTIAL_URI = 'partial.xlsx';
const FULL_URI = 'full.xlsx';
const PARTIAL_ROWS = [
    { at: '2026-02-01T10:00:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
    { at: '2026-02-02T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 50 }
];

const layer = makeInzhurOperationsLayer({
    [PARTIAL_URI]: buildInzhurOperationsWorkbook(PARTIAL_ROWS),
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
});
