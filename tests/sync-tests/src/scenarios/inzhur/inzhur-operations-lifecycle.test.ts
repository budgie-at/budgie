import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { InzhurSetupService, ResyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { fetchSourceLedger } from '../../harness/inzhur/fetch-source-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { CASH_AFTER_HISTORY, FULL_HISTORY_ROWS, OCEAN, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const URI = 'operations.xlsx';
const OLDER_URI = 'older.xlsx';
const NEWER_URI = 'newer.xlsx';
const FRESH_URI = 'fresh.xlsx';
const FUTURE_URI = 'future.xlsx';

const layer = makeInzhurOperationsLayer({
    [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [OLDER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(0, 4)),
    [NEWER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(4)),
    [FRESH_URI]: buildInzhurOperationsWorkbook([...FULL_HISTORY_ROWS, { at: '2026-06-10T10:00:00', type: TOP_UP_TYPE, debit: 50 }]),
    [FUTURE_URI]: buildInzhurOperationsWorkbook([
        ...FULL_HISTORY_ROWS.slice(0, 4),
        { at: '2099-01-01T10:00:00', type: TOP_UP_TYPE, debit: 1 }
    ])
});

const snapshotLedger = Effect.map(fetchSourceLedger(ExternalSourceEnum.INZHUR), ledger =>
    ledger.map(({ id, externalId }) => [id, externalId])
);

describe('inzhur/operations-lifecycle', () => {
    it.effect('is idempotent for the same export, an overlapping export and an older export', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();
            const before = yield* snapshotLedger;

            for (const uri of [URI, NEWER_URI, OLDER_URI]) {
                const summary = yield* importInzhurOperations(uri);

                expect(summary.recordedCount).toBe(0);
                expect(yield* snapshotLedger).toEqual(before);
                expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            }
        }).pipe(Effect.provide(layer))
    );

    it.effect('extends an older export with the full export without duplicating anything', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(OLDER_URI);
            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();
            const externalIds = (yield* fetchInzhurLedger()).map(({ externalId }) => externalId);

            expect(new Set(externalIds).size).toBe(externalIds.length);
            expect(yield* fetchAccountBalance((yield* requireInzhurFundByName(OCEAN)).id)).toBe(0);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('replaces an estimated balance correction with the exact entries of an export covering its day', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations(OLDER_URI);

            const inzhurSetupService = yield* InzhurSetupService;
            const { cashAccount } = yield* requireInzhurSetup();

            yield* inzhurSetupService.setActualBalance(6000);

            expect((yield* fetchInzhurLedger()).some(({ externalId }) => externalId?.startsWith('inzhur:actual-balance:'))).toBe(true);

            const summary = yield* importInzhurOperations(FUTURE_URI);

            expect(summary.removedEstimateCount).toBe(1);
            expect((yield* fetchInzhurLedger()).some(({ externalId }) => externalId?.startsWith('inzhur:actual-balance:'))).toBe(false);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(5501 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps the last export date through a resync', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(URI);

            const resyncService = yield* ResyncService;
            const { cashAccount } = yield* requireInzhurSetup();
            const reit = yield* requireInzhurFundByName('Inzhur REIT');

            for (const sinceDays of [null, 30]) {
                yield* resyncService.resync({ accountId: cashAccount.id, sinceDays });
                yield* resyncService.resync({ accountId: reit.id, sinceDays });
            }

            expect((yield* requireInzhurSetup()).lastStatementDate).toBe('2026-03-20');
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('reminds about a stale export after activity and clears the reminder when a fresh export is imported', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(URI);

            const bankAccount = yield* seedInzhurBankAccount;
            const setupService = yield* InzhurSetupService;

            yield* importInzhurBankFlow(bankAccount.id, 'later-top-up', TOP_UP_DESCRIPTION, -700, new Date('2026-05-01T08:00:00.000Z'));
            yield* consolidateInzhur;

            expect(yield* setupService.findStatementReminder(new Date('2026-03-25T00:00:00.000Z'))).toBeNull();
            expect(yield* setupService.findStatementReminder(new Date('2026-06-15T00:00:00.000Z'))).toMatchObject({
                lastStatementDate: '2026-03-20'
            });

            yield* importInzhurOperations(FRESH_URI);

            expect(yield* setupService.findStatementReminder(new Date('2026-06-15T00:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );
});
