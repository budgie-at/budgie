import { HistoricalExchangeRateEntityTable, CurrencyEnum, SettingsEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';
import { MoneyDataUpgradeService } from '@budgie/ledger';
import { InzhurGainRangeEnum, InzhurGainService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { requireInstrument, testDb } from '../../harness';
import { buildInzhurOperationsWorkbook } from '../../harness/inzhur/build-inzhur-operations-workbook';
import { findPendingTopUps } from '../../harness/inzhur/find-pending-top-ups';
import { importInzhurBankFlow } from '../../harness/inzhur/import-inzhur-bank-flow';
import { importInzhurOperations } from '../../harness/inzhur/import-inzhur-operations';
import { REIT_DIVIDEND_DESCRIPTION, TOP_UP_DESCRIPTION } from '../../harness/inzhur/inzhur-bank-descriptions.constant';
import { REIT_ISIN } from '../../harness/inzhur/inzhur-fund-isins.constant';
import {
    DIVIDEND_TYPE,
    FULL_HISTORY_ROWS,
    OCEAN,
    REIT,
    TAX_TYPE,
    TOP_UP_AT,
    TOP_UP_TYPE,
    WITHDRAWAL_TYPE
} from '../../harness/inzhur/inzhur-operation-rows.constant';
import { makeInzhurOperationsLayer } from '../../harness/inzhur/make-inzhur-operations-layer';
import { recordManualPurchase } from '../../harness/inzhur/record-manual-purchase';
import { requireInzhurFundByName } from '../../harness/inzhur/require-inzhur-fund-by-name';
import { seedInzhurBankAccount } from '../../harness/inzhur/seed-inzhur-bank-account';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { REIT_PRICE, seedInzhurReitPrices } from '../../harness/inzhur/seed-inzhur-reit-prices';

const FIRST_DAY = '2026-01-10';
const TODAY = '2026-03-01';
const HELD_ROWS = [
    { at: TOP_UP_AT, type: TOP_UP_TYPE, debit: 1000 },
    { at: '2026-01-10T10:05:00', type: 'Купівля 100 сертифікатів', fund: REIT, credit: 1000 }
];

const layer = makeInzhurOperationsLayer({
    'held.xlsx': buildInzhurOperationsWorkbook(HELD_ROWS),
    'dividend.xlsx': buildInzhurOperationsWorkbook([
        ...HELD_ROWS,
        { at: '2026-02-01T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 20 },
        { at: '2026-02-01T10:00:05', type: TAX_TYPE, fund: REIT, credit: 4 }
    ]),
    'bank-dividend.xlsx': buildInzhurOperationsWorkbook([
        ...HELD_ROWS,
        { at: '2026-02-01T10:00:00', type: DIVIDEND_TYPE, fund: REIT, debit: 120 },
        { at: '2026-02-01T10:01:00', type: WITHDRAWAL_TYPE, credit: 120 }
    ]),
    'full.xlsx': buildInzhurOperationsWorkbook(FULL_HISTORY_ROWS)
});

const findAllTimeGain = Effect.fnUntraced(function* () {
    const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

    return report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL) ?? null;
});

const findFundAllTimeGain = Effect.fnUntraced(function* (fundAccountId: number) {
    const report = yield* Effect.flatMap(InzhurGainService, service => service.getFundReport(fundAccountId, TODAY));

    return report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL) ?? null;
});

const importHeld = Effect.gen(function* () {
    yield* importInzhurOperations('held.xlsx');

    return yield* requireInzhurFundByName(REIT);
});

const topUpFromBank = Effect.gen(function* () {
    const bankAccount = yield* seedInzhurBankAccount;

    yield* importInzhurBankFlow(bankAccount.id, 'top-up', TOP_UP_DESCRIPTION, -500, new Date('2026-02-10T08:00:00.000Z'));
});

describe('inzhur/gain', () => {
    it.effect('includes bank-paid dividends in institution gain before and after export pairing', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);
            const reit = yield* importHeld;
            const bankAccount = yield* seedInzhurBankAccount;
            yield* importInzhurBankFlow(
                bankAccount.id,
                'bank-dividend',
                REIT_DIVIDEND_DESCRIPTION,
                120,
                new Date('2026-02-01T10:01:00.000Z')
            );
            expect(yield* findFundAllTimeGain(reit.id)).toMatchObject({ gain: 120 });
            expect(yield* findAllTimeGain()).toMatchObject({ gain: 120 });
            yield* importInzhurOperations('bank-dividend.xlsx');
            expect(yield* findFundAllTimeGain(reit.id)).toMatchObject({ gain: 120 });
            expect(yield* findAllTimeGain()).toMatchObject({ gain: 120 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('reports no gain when the price did not move', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);
            yield* importHeld;

            expect(yield* findAllTimeGain()).toMatchObject({
                startDate: FIRST_DAY,
                startValue: 1000,
                endValue: 1000,
                contributions: 0,
                gain: 0,
                percent: 0
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('counts a price rise as gain for the institution and the fund', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);
            yield* seedInzhurPrice(REIT_ISIN, '2026-02-01', REIT_PRICE + 2);

            const reit = yield* importHeld;
            const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

            expect(yield* findAllTimeGain()).toMatchObject({ startValue: 1000, gain: 200, percent: 0.2 });
            expect(report?.gainSeries.at(0)).toEqual({ date: FIRST_DAY, value: 0 });
            expect(report?.gainSeries.at(-1)?.value).toBe(200);
            expect(yield* findFundAllTimeGain(reit.id)).toMatchObject({ gain: 200 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('treats a bank top-up as a contribution, not gain', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);
            yield* importHeld;
            yield* topUpFromBank;

            const gainService = yield* InzhurGainService;
            const report = yield* gainService.getInstitutionReport(TODAY);

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 500, gain: 0 });
            expect(report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL)).toMatchObject({ contributions: 500, gain: 0 });
            expect(report?.gainSeries.every(point => point.value === 0)).toBe(true);
            expect(report?.series.at(-1)?.value).toBe((report?.series.at(0)?.value ?? 0) + 500);
        }).pipe(Effect.provide(layer))
    );

    it.effect('treats a purchase paid from cash as no gain for the institution or the fund', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);

            const reit = yield* importHeld;

            yield* topUpFromBank;
            yield* recordManualPurchase({
                topUpTransactionId: (yield* findPendingTopUps)[0].transactionId,
                fundName: REIT,
                certificates: 50,
                amount: 500,
                operatedAt: new Date('2026-02-11T09:00:00.000Z')
            });

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 500, gain: 0 });
            expect(yield* findFundAllTimeGain(reit.id)).toMatchObject({ contributions: 500, gain: 0 });
        }).pipe(Effect.provide(layer))
    );

    it.effect('includes dividend and tax in the fund gain so it matches the return on cost', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);
            yield* importInzhurOperations('dividend.xlsx');

            const gainService = yield* InzhurGainService;
            const reit = yield* requireInzhurFundByName(REIT);

            expect((yield* findFundAllTimeGain(reit.id))?.gain).toBe(16);
            expect((yield* gainService.getFundCostReturn(reit.id, TODAY))?.returnAmount).toBe(16);
            expect((yield* findAllTimeGain())?.gain).toBe(16);
        }).pipe(Effect.provide(layer))
    );

    it.effect('returns a null gain instead of failing when a price is missing', () =>
        Effect.gen(function* () {
            const reit = yield* importHeld;

            expect(yield* findAllTimeGain()).toMatchObject({ startValue: null, gain: null, percent: null });
            expect(yield* findFundAllTimeGain(reit.id)).toMatchObject({ startValue: null, gain: null });
            expect(yield* (yield* InzhurGainService).getFundCostReturn(reit.id, TODAY)).toBeNull();
        }).pipe(Effect.provide(layer))
    );

    it.effect('builds a daily value series and offers only the ranges that have data', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, FIRST_DAY, REIT_PRICE);

            const reit = yield* importHeld;
            const gainService = yield* InzhurGainService;
            const report = yield* gainService.getInstitutionReport(TODAY);
            const fundReport = yield* gainService.getFundReport(reit.id, TODAY);

            expect(report?.series.at(0)).toEqual({ date: FIRST_DAY, value: 1000 });
            expect(report?.series.at(-1)?.date).toBe(TODAY);
            expect(report?.gains.map(gain => gain.range)).toEqual([InzhurGainRangeEnum.MONTH, InzhurGainRangeEnum.ALL]);
            expect(fundReport?.prices.map(price => price.date)).toEqual([FIRST_DAY]);
            expect(report?.gains.find(gain => gain.range === InzhurGainRangeEnum.MONTH)).toMatchObject({
                startDate: '2026-01-30',
                gain: 0
            });
        }).pipe(Effect.provide(layer))
    );

    it.effect('reports the return on cost per fund including dividends and tax', () =>
        Effect.gen(function* () {
            yield* seedInzhurReitPrices;
            yield* importInzhurOperations('full.xlsx');

            const gainService = yield* InzhurGainService;
            const ocean = yield* requireInzhurFundByName(OCEAN);
            const reit = yield* requireInzhurFundByName(REIT);

            expect(yield* gainService.getFundCostReturn(ocean.id, '2026-04-01')).toMatchObject({
                invested: 4000,
                proceeds: 4300,
                dividends: 200,
                tax: 36,
                value: 0,
                returnAmount: 464
            });
            expect(yield* gainService.getFundCostReturn(reit.id, '2026-04-01')).toMatchObject({
                invested: 4800,
                value: 4800,
                returnAmount: 0,
                percent: 0
            });
            expect(yield* gainService.getFundCostReturn(reit.id, '2026-02-15')).toMatchObject({
                invested: 500,
                value: 500,
                returnAmount: 0
            });
        }).pipe(Effect.provide(layer))
    );
    it.effect('starts gains at the first valued day when prices begin after the history', () =>
        Effect.gen(function* () {
            yield* seedInzhurPrice(REIT_ISIN, '2026-03-05', REIT_PRICE);
            yield* importHeld;

            const report = yield* (yield* InzhurGainService).getInstitutionReport('2026-03-06');

            expect(report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL)).toMatchObject({ startDate: '2026-03-05', gain: 0 });
            expect(report?.gainSeries).toEqual([
                { date: '2026-03-05', value: 0 },
                { date: '2026-03-06', value: 0 }
            ]);
        }).pipe(Effect.provide(layer))
    );
    it.effect('revalues fund entries through UAH when upgrading to a EUR base', () =>
        Effect.gen(function* () {
            const reit = yield* importHeld;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);

            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

            yield* testDb
                .insert(HistoricalExchangeRateEntityTable)
                .values({ sourceInstrumentId: reit.instrumentId, targetInstrumentId: hryvnia.id, rateDate: FIRST_DAY, rate: REIT_PRICE });
            yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
            yield* testDb.update(TransactionEntryEntityTable).set({ baseInstrumentId: null, baseExchangeRate: null, baseAmount: null });
            yield* (yield* MoneyDataUpgradeService).run('Missing base instrument');

            const entries = yield* testDb
                .select()
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.accountId, reit.id));

            expect(entries).toHaveLength(1);
            expect(entries[0].baseInstrumentId).toBe(euro.id);
            expect(entries[0].baseExchangeRate).toBeGreaterThan(0);
            expect(entries[0].baseAmount).toBeGreaterThan(0);
        }).pipe(Effect.provide(layer))
    );
});
