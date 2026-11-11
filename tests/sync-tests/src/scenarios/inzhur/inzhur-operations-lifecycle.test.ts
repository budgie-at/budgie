import { ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { InzhurSetupService, ResyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { consolidateInzhur } from '../../harness/inzhur/consolidate-inzhur';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { fetchSourceLedger } from '../../harness/inzhur/fetch-source-ledger';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import { inzhurHomeClientLayer } from '../../harness/inzhur/inzhur-home-client.layer';
import { CASH_AFTER_HISTORY, FULL_HISTORY_ROWS, OCEAN, REIT, TOP_UP_TYPE } from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const URI = 'operations.xlsx';
const OLDER_URI = 'older.xlsx';
const NEWER_URI = 'newer.xlsx';
const FRESH_URI = 'fresh.xlsx';

const layer = makeInzhurOperationsLayer({
    'chain.xlsx': buildInzhurOperationsWorkbook([
        ...FULL_HISTORY_ROWS,
        { at: '2026-04-05T09:00:00', type: 'Конвертація', fund: REIT, debit: 4800 },
        { at: '2026-04-05T09:00:03', type: 'Конвертація', fund: 'Inzhur Energy', credit: 4800 }
    ]),
    'extended.xlsx': buildInzhurOperationsWorkbook([
        { at: '2026-01-05T09:00:00', type: TOP_UP_TYPE, debit: 800 },
        { at: '2026-01-05T10:00:00', type: 'Купівля 20 сертифікатів', fund: OCEAN, credit: 800 },
        ...FULL_HISTORY_ROWS
    ]),
    [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [OLDER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(0, 4)),
    [NEWER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(4)),
    [FRESH_URI]: buildInzhurOperationsWorkbook([...FULL_HISTORY_ROWS, { at: '2026-06-10T10:00:00', type: TOP_UP_TYPE, debit: 50 }])
});

const snapshotLedger = Effect.map(fetchSourceLedger(ExternalSourceEnum.INZHUR), ledger =>
    ledger.map(({ id, externalId }) => [id, externalId])
);

const findConvertedInQuantity = (fundAccountId: number) =>
    Effect.map(
        fetchInzhurLedger,
        ledger =>
            ledger
                .filter(transaction => transaction.title === 'Bought REIT')
                .at(-1)
                ?.entries.find(entry => entry.accountId === fundAccountId)?.amount
    );

describe('inzhur/operations-lifecycle', () => {
    it.effect('refines a stored conversion estimate when a nearer price arrives before a chained conversion re-import', () =>
        Effect.gen(function* () {
            yield* importInzhurOperations('chain.xlsx');
            const reit = yield* requireInzhurFundByName(REIT);
            expect(yield* fetchAccountBalance(reit.id)).toBe(0);
            expect(yield* findConvertedInQuantity(reit.id)).toBe(430 * PRECISION);
            yield* seedInzhurPrice(REIT_ISIN, '2026-03-05', 10.05);
            yield* importInzhurOperations('chain.xlsx');
            expect(yield* fetchAccountBalance(reit.id)).toBe(0);
            expect(yield* findConvertedInQuantity(reit.id)).toBe(428 * PRECISION);
            const snapshot = yield* snapshotLedger;
            yield* importInzhurOperations('chain.xlsx');
            expect(yield* snapshotLedger).toEqual(snapshot);
        }).pipe(Effect.provide(Layer.merge(layer, inzhurHomeClientLayer({ [REIT]: 10, 'Inzhur Energy': 10 }))))
    );

    it.effect('reconciles sell-all quantities when earlier holdings arrive and preserves ids on re-import', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations(URI);
            const { cashAccount } = yield* requireInzhurSetup();
            const reit = yield* requireInzhurFundByName(REIT);
            const cashBefore = yield* fetchAccountBalance(cashAccount.id);
            const reitBefore = yield* fetchAccountBalance(reit.id);
            const summary = yield* importInzhurOperations('extended.xlsx');
            expect(summary).toMatchObject({ recordedCount: 3, alreadyImportedCount: 8 });
            const ocean = yield* requireInzhurFundByName(OCEAN);
            expect(summary.funds.find(fund => fund.name === OCEAN)?.convertedOutQuantity).toBe(120);
            expect(yield* fetchAccountBalance(ocean.id)).toBe(0);
            expect(
                (yield* fetchInzhurLedger)
                    .find(transaction => transaction.title === 'Sold Ocean')
                    ?.entries.find(entry => entry.accountId === ocean.id)?.amount
            ).toBe(120 * PRECISION);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(cashBefore);
            expect(yield* fetchAccountBalance(reit.id)).toBe(reitBefore);
            const snapshot = yield* snapshotLedger;
            yield* importInzhurOperations('extended.xlsx');
            expect(yield* snapshotLedger).toEqual(snapshot);
        }).pipe(Effect.provide(layer))
    );

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
            const externalIds = (yield* fetchInzhurLedger).map(({ externalId }) => externalId);

            expect(new Set(externalIds).size).toBe(externalIds.length);
            expect(yield* fetchAccountBalance((yield* requireInzhurFundByName(OCEAN)).id)).toBe(0);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
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
