import { PRECISION, TransactionEntryTypeEnum } from '@budgie/contracts';
import {
    InzhurGainRangeEnum,
    InzhurGainService,
    InzhurPriceMissingError,
    InzhurSetupService,
    TransferConsolidationService
} from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance } from '../../harness';
import { buildInzhurBaselineItems } from '../../harness/inzhur/build-inzhur-baseline-items';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { buildInzhurStatementItems } from '../../harness/inzhur/build-inzhur-statement-items';
import { fetchInzhurLedger } from '../../harness/inzhur/fetch-inzhur-ledger';
import { fetchInzhurOperationsLedger } from '../../harness/inzhur/fetch-inzhur-operations-ledger';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import { inzhurHomeClientLayer } from '../../harness/inzhur/inzhur-home-client.layer';
import {
    CASH_AFTER_HISTORY,
    DIVIDEND_TYPE,
    FULL_HISTORY_ROWS,
    OCEAN,
    REIT,
    TOP_UP_TYPE
} from '../../harness/inzhur/inzhur-operation-rows.constant';
import { FIRST_URI, SECOND_DATE, SECOND_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { requireInzhurSetup } from '../../harness/inzhur/require-inzhur-setup';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurFundInstrument } from '../../harness/inzhur/seed-inzhur-fund-instrument';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const FULL_URI = 'full.xlsx';
const OLDER_TOP_UP_URI = 'older-top-up.xlsx';
const NO_SURCHARGE_URI = 'no-surcharge.xlsx';
const SECOND_TOP_UP_URI = 'second-top-up.xlsx';
const OLDER_URI = 'older.xlsx';
const TAX_URI = 'tax.xlsx';
const DAY_EDGE_URI = 'day-edge.xlsx';
const INTERVAL_URI = 'interval.xlsx';
const FRESH_BANK_URI = 'fresh-bank.xlsx';
const TOP_UP_DESCRIPTION = 'ТОВ "Інжур Кепітал"';
const CONVERSION = 'Конвертація';

const rowsWithoutSurcharge = FULL_HISTORY_ROWS.filter(row => row.type !== 'Доплата');
const bytesByUri = {
    [FULL_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS),
    [NO_SURCHARGE_URI]: buildInzhurOperationsWorkbook(rowsWithoutSurcharge),
    [SECOND_TOP_UP_URI]: buildInzhurOperationsWorkbook([{ at: '2026-01-11T10:00:00', type: TOP_UP_TYPE, debit: 1000 }]),
    [OLDER_URI]: buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS.slice(0, 4)),
    [TAX_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 1000 },
        { at: '2026-01-10T10:05:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
        { at: '2026-02-01T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 20 },
        { at: '2026-02-01T10:00:05', type: 'Сплата податку', fund: REIT, credit: 4 }
    ]),
    [DAY_EDGE_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-03-01T10:00:00', type: TOP_UP_TYPE, debit: 1000 },
        { at: '2026-03-04T23:30:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
        { at: '2026-03-05T00:30:00', type: 'Купівля 5 сертифікатів', fund: REIT, credit: 50 }
    ]),
    [INTERVAL_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 10_000 },
        { at: '2026-01-10T10:05:00', type: 'Купівля 100 сертифікатів', fund: OCEAN, credit: 1000 },
        { at: '2026-02-01T10:00:00', type: CONVERSION, fund: OCEAN, debit: 1000 },
        { at: '2026-02-01T10:00:03', type: CONVERSION, fund: REIT, credit: 1000 },
        { at: '2026-03-01T10:00:00', type: CONVERSION, fund: REIT, debit: 1000 },
        { at: '2026-03-01T10:00:03', type: CONVERSION, fund: OCEAN, credit: 1000 },
        { at: '2026-04-01T10:00:00', type: CONVERSION, fund: OCEAN, debit: 1000 },
        { at: '2026-04-01T10:00:03', type: CONVERSION, fund: REIT, credit: 1000 }
    ]),
    [FRESH_BANK_URI]: buildInzhurOperationsWorkbook([
        { at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 1000 },
        { at: '2026-01-10T10:05:00', type: 'Купівля 10 сертифікатів', fund: REIT, credit: 100 },
        { at: '2026-04-01T10:00:00', type: TOP_UP_TYPE, debit: 50 }
    ])
};
const statementItems = {
    [FIRST_URI]: buildInzhurBaselineItems(470, 2),
    [SECOND_URI]: buildInzhurStatementItems(SECOND_DATE, [{ layout: INZHUR_REIT_LAYOUT, quantity: 500 }]),
    interval: buildInzhurBaselineItems(300, 2),
    dayEdge: buildInzhurStatementItems('04.03.2026', [{ layout: INZHUR_REIT_LAYOUT, quantity: 10 }])
};
const layer = makeInzhurOperationsLayer(bytesByUri, statementItems);
const setUp = Effect.flatMap(InzhurSetupService, service => service.setup(0));
const consolidate = Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

const seedReit = seedInzhurReitPrices;

describe('inzhur/operations-review', () => {
    it.effect('estimates a first-import conversion from the live Inzhur price when nothing is cached', () =>
        Effect.gen(function* () {
            yield* setUp;

            const summary = yield* importInzhurOperations(FULL_URI);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(summary.funds.find(fund => fund.name === REIT)).toMatchObject({ boughtQuantity: 480, isQuantityEstimated: true });
            expect(yield* fetchAccountBalance(reit.id)).toBe(480 * PRECISION);
        }).pipe(Effect.provide(inzhurHomeClientLayer({ [REIT]: 10 })), Effect.provide(layer))
    );

    it.effect('rolls back cleanly with a typed error when no price can be found at all', () =>
        Effect.gen(function* () {
            yield* setUp;

            expect(yield* Effect.flip(importInzhurOperations(FULL_URI))).toBeInstanceOf(InzhurPriceMissingError);
            expect((yield* requireInzhurSetup()).fundAccounts).toEqual([]);
        }).pipe(Effect.provide(inzhurHomeClientLayer({})), Effect.provide(layer))
    );

    it.effect('does not let a later export re-match a bank transfer an earlier export already claimed', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* setUp;
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'bank-top-up',
                TOP_UP_DESCRIPTION,
                -1000,
                new Date('2026-01-10T08:00:00.000Z')
            );
            yield* consolidate;
            yield* importInzhurOperations(OLDER_TOP_UP_URI);

            const summary = yield* importInzhurOperations(SECOND_TOP_UP_URI);
            const { cashAccount } = yield* requireInzhurSetup();

            expect(summary.bankMatches).toEqual({ paired: 0, unpaired: 1 });
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(2000 * PRECISION);
        }).pipe(
            Effect.provide(
                makeInzhurOperationsLayer({
                    ...bytesByUri,
                    [OLDER_TOP_UP_URI]: buildInzhurOperationsWorkbook([{ at: '2026-01-10T10:00:00', type: TOP_UP_TYPE, debit: 1000 }])
                })
            )
        )
    );

    it.effect('supersedes estimates only inside the period the export covers', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(100, 470, 2);
            yield* importInzhurStatement(SECOND_URI);
            yield* seedReit;

            const summary = yield* importInzhurOperations(OLDER_URI);
            const leftovers = (yield* fetchInzhurLedger()).filter(({ externalId }) => externalId?.startsWith('inzhur:2026-10-31'));

            expect(summary.removedEstimateCount).toBe(0);
            expect(leftovers.length).toBeGreaterThan(0);
        }).pipe(Effect.provide(layer))
    );

    it.effect('updates an imported conversion when its surcharge arrives in a later export', () =>
        Effect.gen(function* () {
            yield* setUp;
            yield* seedReit;
            yield* importInzhurOperations(NO_SURCHARGE_URI);

            const { cashAccount } = yield* requireInzhurSetup();

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe((CASH_AFTER_HISTORY + 10) * PRECISION);

            yield* importInzhurOperations(FULL_URI);

            const conversionBuy = (yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Bought REIT').at(-1);

            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(CASH_AFTER_HISTORY * PRECISION);
            expect(conversionBuy?.entries[0]).toMatchObject({ type: TransactionEntryTypeEnum.CREDIT, amount: 4300 * PRECISION });
        }).pipe(Effect.provide(layer))
    );

    it.effect('ends the holdings statement day at Kyiv midnight', () =>
        Effect.gen(function* () {
            yield* setUp;
            const summary = yield* importInzhurOperations(DAY_EDGE_URI);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(summary.reconciliations).toEqual([]);

            const statement = yield* importInzhurStatement('dayEdge');

            expect(statement.funds).toEqual([]);
            expect(yield* fetchAccountBalance(reit.id)).toBe(15 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('fills a statement remainder only into the holding interval after the last sell-all', () =>
        Effect.gen(function* () {
            yield* setUp;
            yield* importInzhurStatement('interval');
            yield* seedInzhurFundInstrument('INZHUR:OCEAN', OCEAN);
            yield* seedInzhurPrice('INZHUR:OCEAN', '2026-01-10', 10);
            yield* seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, '2026-01-10', 10);
            yield* importInzhurOperations(INTERVAL_URI);

            const reitBuys = (yield* fetchInzhurOperationsLedger).filter(({ title }) => title === 'Bought REIT');

            expect(reitBuys.map(({ entries }) => entries[1].amount)).toEqual([100 * PRECISION, 300 * PRECISION]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('includes dividend tax in the fund gain so it matches the return on cost', () =>
        Effect.gen(function* () {
            yield* setUp;
            yield* seedReit;
            yield* importInzhurOperations(TAX_URI);

            const gain = yield* InzhurGainService;
            const reit = yield* requireInzhurFundByName(REIT);
            const report = yield* gain.getFundReport(reit.id, '2026-04-01');
            const costReturn = yield* gain.getFundCostReturn(reit.id, '2026-04-01');

            expect(report?.gains.find(item => item.range === InzhurGainRangeEnum.ALL)?.gain).toBe(16);
            expect(costReturn?.returnAmount).toBe(16);
        }).pipe(Effect.provide(layer))
    );

    it.effect('values the return on cost as of the requested day', () =>
        Effect.gen(function* () {
            yield* setUp;
            yield* seedReit;
            yield* importInzhurOperations(FULL_URI);

            const gain = yield* InzhurGainService;
            const reit = yield* requireInzhurFundByName(REIT);

            expect(yield* gain.getFundCostReturn(reit.id, '2026-02-15')).toMatchObject({ invested: 500, value: 500, returnAmount: 0 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('keeps the reminder cleared when the newest operation was matched to a bank transfer', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedInzhurBankAccount;

            yield* setUp;
            yield* seedReit;
            yield* importInzhurBankTransaction(
                bankAccount.id,
                'fresh-top-up',
                TOP_UP_DESCRIPTION,
                -50,
                new Date('2026-04-01T08:00:00.000Z')
            );
            yield* consolidate;
            yield* importInzhurOperations(FRESH_BANK_URI);

            const setupService = yield* InzhurSetupService;

            expect(yield* setupService.findStatementReminder(new Date('2026-04-20T00:00:00.000Z'))).toBeNull();
        }).pipe(Effect.provide(layer))
    );
});
