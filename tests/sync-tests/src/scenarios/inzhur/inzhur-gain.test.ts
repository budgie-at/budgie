import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { InzhurGainRangeEnum, InzhurGainService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed } from '../../harness';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import { ENERGY_PRICE, REIT_PRICE, SECOND_URI } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurGainLayer } from '../../harness/inzhur/make-inzhur-gain-layer';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const FIRST_DAY = '2026-09-30';
const MILLISECONDS_PER_DAY = 86_400_000;
const TOP_UP_AT = new Date(Date.now() + MILLISECONDS_PER_DAY);
const TODAY = new Date(Date.now() + 2 * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
const UAH_INSTRUMENT_ID = 1;

const seedBaselinePrices = (reitPrice: number) =>
    Effect.all([
        seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, FIRST_DAY, reitPrice),
        seedInzhurPrice(INZHUR_ENERGY_LAYOUT.isin, FIRST_DAY, ENERGY_PRICE)
    ]);

const topUpFromBank = Effect.fnUntraced(function* (externalId: string) {
    const bankAccount = yield* seed.account({
        title: 'Monobank Card',
        externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: UAH_INSTRUMENT_ID
    });

    yield* importInzhurBankTransaction(bankAccount.id, 'top-up', 'ТОВ "Інжур Кепітал"', -1000, TOP_UP_AT);
    yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));
});

const findAllTimeGain = Effect.fnUntraced(function* () {
    const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

    return report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL) ?? null;
});

const findFundAllTimeGain = Effect.fnUntraced(function* (fundAccountId: number) {
    const report = yield* Effect.flatMap(InzhurGainService, service => service.getFundReport(fundAccountId, TODAY));

    return report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL) ?? null;
});

describe('inzhur/gain', () => {
    it.effect('reports no gain when nothing changed since the first statement', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(100, 1000, 2);
            yield* seedBaselinePrices(REIT_PRICE);

            expect(yield* findAllTimeGain()).toMatchObject({
                startDate: FIRST_DAY,
                startValue: 100 + 1000 * REIT_PRICE + 2 * ENERGY_PRICE,
                endValue: 100 + 1000 * REIT_PRICE + 2 * ENERGY_PRICE,
                contributions: 0,
                gain: 0,
                percent: 0
            });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );

    it.effect('counts a price rise as gain for the institution and the fund', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            yield* seedBaselinePrices(REIT_PRICE - 1);

            const startValue = 100 + 1000 * (REIT_PRICE - 1) + 2 * ENERGY_PRICE;

            expect(yield* findAllTimeGain()).toMatchObject({ startValue, gain: 1000, percent: 1000 / startValue });
            const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

            expect(report?.gainSeries.at(0)).toEqual({ date: FIRST_DAY, value: 0 });
            expect(report?.gainSeries.at(-1)?.value).toBe(1000);
            expect(yield* findFundAllTimeGain(reitAccount.id)).toMatchObject({ gain: 1000 });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );

    it.effect('treats a bank top-up as a contribution, not gain', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(0, 1000, 2);
            yield* seedBaselinePrices(REIT_PRICE);
            yield* topUpFromBank('inzhur-gain-card');

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 1000, gain: 0 });
            const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

            expect(report?.gainSeries.every(point => point.value === 0)).toBe(true);
            expect(report?.series.at(-1)?.value).toBe((report?.series.at(0)?.value ?? 0) + 1000);
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );

    it.effect('keeps a top-up between statements out of the gain since the previous statement', () =>
        Effect.gen(function* () {
            yield* setUpInzhurWithBaseline(0, 1000, 2);
            yield* seedBaselinePrices(REIT_PRICE);
            yield* topUpFromBank('inzhur-gain-since-card');

            expect(yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionGainSince(FIRST_DAY, TODAY))).toMatchObject({
                contributions: 1000,
                gain: 0
            });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );

    it.effect('treats a buy paid from cash as no gain for the institution or the fund', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(1000, 1000, 2);

            yield* seedBaselinePrices(REIT_PRICE);
            yield* importInzhurStatement(SECOND_URI);

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 0, gain: 0 });
            expect(yield* findFundAllTimeGain(reitAccount.id)).toMatchObject({ contributions: 500, gain: 0 });
        }).pipe(Effect.provide(makeInzhurGainLayer(1050, 2)))
    );

    it.effect('counts reinvested dividends as gain for the institution and the fund', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(0, 1000, 2);

            yield* seedBaselinePrices(REIT_PRICE);
            yield* importInzhurStatement(SECOND_URI);

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 0, gain: 1000 });
            expect(yield* findFundAllTimeGain(reitAccount.id)).toMatchObject({ contributions: 0, gain: 1000 });
        }).pipe(Effect.provide(makeInzhurGainLayer(1100, 2)))
    );

    it.effect('treats a sell into cash as no gain', () =>
        Effect.gen(function* () {
            const { energyAccount } = yield* setUpInzhurWithBaseline(0, 1000, 2);

            yield* seedBaselinePrices(REIT_PRICE);
            yield* importInzhurStatement(SECOND_URI);

            expect(yield* findAllTimeGain()).toMatchObject({ contributions: 0, gain: 0 });
            expect(yield* findFundAllTimeGain(energyAccount.id)).toMatchObject({ contributions: -ENERGY_PRICE, gain: 0 });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 1)))
    );

    it.effect('returns a null gain instead of failing when a price is missing at the start', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            expect(yield* findAllTimeGain()).toMatchObject({ startValue: null, gain: null, percent: null });
            expect(yield* findFundAllTimeGain(reitAccount.id)).toMatchObject({ startValue: null, gain: null });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );

    it.effect('builds a daily value series and offers only the ranges that have data', () =>
        Effect.gen(function* () {
            const { reitAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            yield* seedBaselinePrices(REIT_PRICE);
            const report = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));
            const fundReport = yield* Effect.flatMap(InzhurGainService, service => service.getFundReport(reitAccount.id, TODAY));
            const sinceSecond = yield* Effect.flatMap(InzhurGainService, service => service.getInstitutionGainSince('2026-10-31', TODAY));

            expect(report?.series.at(0)).toEqual({ date: FIRST_DAY, value: 100 + 1000 * REIT_PRICE + 2 * ENERGY_PRICE });
            expect(report?.series.at(-1)?.date).toBe(TODAY);
            expect(report?.gains.map(gain => gain.range)).toContain(InzhurGainRangeEnum.MONTH);
            expect(report?.gains.at(-1)?.range).toBe(InzhurGainRangeEnum.ALL);
            expect(fundReport?.prices.map(price => price.date)).toEqual([FIRST_DAY, '2026-10-31']);
            expect(sinceSecond).toMatchObject({ startDate: '2026-10-31', gain: 0 });
        }).pipe(Effect.provide(makeInzhurGainLayer(1000, 2)))
    );
});
