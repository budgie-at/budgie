import { ExternalSourceEnum, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import {
    InzhurGainRangeEnum,
    InzhurGainService,
    InzhurImportOutcomeEnum,
    InzhurSetupService,
    TransferConsolidationService
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, testDb } from '../../harness';
import { buildInzhurBaselineItems, buildInzhurHoldings } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { fetchBeforeTrackingCorrections } from '../../harness/inzhur/fetch-before-tracking-corrections';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { fetchSourceLedger } from '../../harness/inzhur/fetch-source-ledger';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import {
    CASH_AFTER_HISTORY,
    CONVERSION_AT,
    DIVIDEND_TYPE,
    FULL_HISTORY_ROWS,
    OCEAN,
    REIT,
    TOP_UP_TYPE
} from '../../harness/inzhur/inzhur-operation-rows.constant';
import { FIRST_URI, SECOND_URI, SECOND_DATE } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundAccount } from '../../harness/inzhur/require-inzhur-fund-account';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurFundInstrument } from '../../harness/inzhur/seed-inzhur-fund-instrument';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const URI = 'operations.xlsx';
const OLDER_URI = 'older.xlsx';
const NEWER_URI = 'newer.xlsx';
const PARTIAL_URI = 'partial.xlsx';
const FRESH_URI = 'fresh.xlsx';
const REIT_CODE = 'INZHUR:REIT';
const ENERGY_NAME = 'Inzhur Energy';
const PARTIAL_ROWS = [
    { at: '2026-02-01T10:00:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
    { at: '2026-02-02T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 50 }
];

const bytesByUri = {
    [URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [OLDER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(0, 4)),
    [NEWER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(4)),
    [PARTIAL_URI]: buildInzhurOperationsWorkbook(PARTIAL_ROWS),
    [FRESH_URI]: buildInzhurOperationsWorkbook([...FULL_HISTORY_ROWS, { at: '2026-06-10T10:00:00', type: TOP_UP_TYPE, debit: 50 }])
};
const statementItems = {
    [FIRST_URI]: buildInzhurBaselineItems(470, 2),
    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, buildInzhurHoldings(500, 2))
};
const layer = makeInzhurOperationsLayer(bytesByUri, statementItems);

const seedReit = Effect.gen(function* () {
    yield* seedInzhurFundInstrument(REIT_CODE, REIT);
    yield* seedInzhurPrice(REIT_CODE, CONVERSION_AT.slice(0, 10), 10);
    yield* seedInzhurPrice(REIT_CODE, '2026-01-10', 10);
});

const setUp = (enteredCash: number) => Effect.flatMap(InzhurSetupService, service => service.setup(enteredCash));

const snapshotLedger = Effect.map(fetchSourceLedger(ExternalSourceEnum.INZHUR), ledger =>
    ledger.map(({ id, externalId }) => [id, externalId])
);

describe('inzhur/operations-lifecycle', () => {
    it.effect('is idempotent for the same export, an overlapping export and an older export', () =>
        Effect.gen(function* () {
            yield* setUp(0);
            yield* seedReit;
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
            yield* setUp(0);
            yield* seedReit;
            yield* importInzhurOperations(OLDER_URI);
            yield* importInzhurOperations(URI);

            const { cashAccount } = yield* requireInzhurSetup();
            const externalIds = (yield* fetchInzhurLedger()).map(({ externalId }) => externalId);

            expect(new Set(externalIds).size).toBe(externalIds.length);
            expect(yield* fetchAccountBalance((yield* requireInzhurFundByName(OCEAN)).id)).toBe(0);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('replaces estimated reinvested dividends and the before-tracking correction with exact entries', () =>
        Effect.gen(function* () {
            const { cashAccount, energyAccount, reitAccount } = yield* setUpInzhurWithBaseline(100, 470, 2);

            yield* importInzhurStatement(SECOND_URI);

            expect((yield* fetchInzhurLedger()).some(({ externalId }) => externalId?.endsWith(':dividend'))).toBe(true);

            const summary = yield* importInzhurOperations(URI);
            const leftovers = (yield* fetchInzhurLedger()).filter(({ externalId }) => !externalId?.startsWith('inzhur:op:'));

            expect(summary.removedEstimateCount).toBeGreaterThan(0);
            expect(leftovers).toMatchObject([{ title: 'Holdings correction' }]);
            expect(yield* fetchBeforeTrackingCorrections).toEqual([]);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(500 * PRECISION);
            expect(yield* fetchAccountBalance(energyAccount.id)).toBe(2 * PRECISION);
            expect(summary.reconciliations).toEqual([{ fundName: ENERGY_NAME, difference: 2 }]);
            expect(
                yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.type, TransactionTypeEnum.ADJUSTMENT))
            ).toHaveLength(1);
        }).pipe(Effect.provide(layer))
    );

    it.effect('fills the converted quantity from a holdings statement when one is imported', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(100, 470, 2);
            const summary = yield* importInzhurOperations(URI);

            expect(yield* fetchAccountBalance(reitAccount.id)).toBe(470 * PRECISION);
            expect(summary.funds.find(fund => fund.name === REIT)).toMatchObject({ boughtQuantity: 470, isQuantityEstimated: false });
            expect(summary.reconciliations).toEqual([{ fundName: ENERGY_NAME, difference: 2 }]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('reconciles quantities to a holdings statement imported after the operations and reports the difference', () =>
        Effect.gen(function* () {
            yield* setUp(0);
            yield* seedReit;
            yield* importInzhurOperations(URI);

            const summary = yield* importInzhurStatement(FIRST_URI);
            const reit = yield* requireInzhurFundAccount(INZHUR_REIT_LAYOUT.isin);

            expect(summary.outcome).toBe(InzhurImportOutcomeEnum.APPLIED);
            expect(summary.funds.map(fund => [fund.name, fund.deltaQuantity])).toEqual([
                [REIT, -10],
                [ENERGY_NAME, 2]
            ]);
            expect(reit.id).toBe((yield* requireInzhurFundByName(REIT)).id);
            expect(yield* fetchAccountBalance(reit.id)).toBe(470 * PRECISION);
            expect((yield* requireInzhurSetup()).fundAccounts.filter(({ title }) => title === REIT)).toHaveLength(1);
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps the entered cash on a partial export and lifts it only to avoid a negative balance', () =>
        Effect.gen(function* () {
            yield* setUp(500);

            const { cashAccount } = yield* requireInzhurSetup();
            const summary = yield* importInzhurOperations(PARTIAL_URI);

            expect(summary.isFullHistory).toBe(false);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(450 * PRECISION);
            expect(yield* fetchBeforeTrackingCorrections).toMatchObject([{ entries: [{ amount: 500 * PRECISION }] }]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('raises the opening cash of a partial export just enough to keep the balance non-negative', () =>
        Effect.gen(function* () {
            yield* setUp(20);

            const { cashAccount } = yield* requireInzhurSetup();

            yield* importInzhurOperations(PARTIAL_URI);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(50 * PRECISION);
            expect(yield* fetchBeforeTrackingCorrections).toMatchObject([{ entries: [{ amount: 100 * PRECISION }] }]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('reports the return on cost per fund including dividends and tax', () =>
        Effect.gen(function* () {
            yield* setUp(0);
            yield* seedReit;
            yield* importInzhurOperations(URI);

            const gain = yield* InzhurGainService;
            const ocean = yield* requireInzhurFundByName(OCEAN);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(yield* gain.getFundCostReturn(ocean.id, '2026-04-01')).toMatchObject({
                invested: 4000,
                proceeds: 4300,
                dividends: 200,
                tax: 36,
                value: 0,
                returnAmount: 464
            });
            expect(yield* gain.getFundCostReturn(reit.id, '2026-04-01')).toMatchObject({
                invested: 4800,
                value: 4800,
                returnAmount: 0,
                percent: 0
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('values a holdings correction at that day price and keeps it out of gain and cost', () =>
        Effect.gen(function* () {
            yield* setUp(0);
            yield* seedReit;
            yield* importInzhurOperations(URI);
            yield* importInzhurStatement(FIRST_URI);

            const gain = yield* InzhurGainService;
            const reit = yield* requireInzhurFundByName(REIT);
            const report = yield* gain.getFundReport(reit.id, '2026-10-15');
            const costReturn = yield* gain.getFundCostReturn(reit.id, '2026-10-15');

            expect(yield* fetchAccountBalance(reit.id)).toBe(470 * PRECISION);
            expect(report?.gains.find(item => item.range === InzhurGainRangeEnum.ALL)?.gain).toBe(0);
            expect(costReturn).toMatchObject({ invested: 4800, value: 4700, returnAmount: 0 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('clears the statement reminder when a fresh operations export is imported', () =>
        Effect.gen(function* () {
            yield* setUp(0);
            yield* seedReit;
            yield* importInzhurOperations(URI);

            const bankAccount = yield* seedInzhurBankAccount;
            const setupService = yield* InzhurSetupService;

            yield* importInzhurBankTransaction(
                bankAccount.id,
                'later-top-up',
                'ТОВ "Інжур Кепітал"',
                -700,
                new Date('2026-05-01T08:00:00.000Z')
            );
            yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

            expect(yield* setupService.findStatementReminder(new Date('2026-03-25T00:00:00.000Z'))).toBeNull();
            expect(yield* setupService.findStatementReminder(new Date('2026-06-15T00:00:00.000Z'))).toMatchObject({
                lastStatementDate: '2026-03-20'
            });

            yield* importInzhurOperations(FRESH_URI);

            expect(yield* setupService.findStatementReminder(new Date('2026-06-15T00:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );
});
