import { AccountTypeEnum, ExternalSourceEnum, PRECISION } from '@budgie/contracts';
import { InzhurGainRangeEnum, InzhurGainService, InzhurSetupService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchAccountBalance, seed } from '../../harness';
import { fetchBeforeTrackingCorrections } from '../../harness/inzhur/fetch-before-tracking-corrections';
import { importInzhurBankTransaction } from '../../harness/inzhur/import-inzhur-bank-transaction';
import { importInzhurStatement } from '../../harness/inzhur/import-inzhur-statement';
import { INZHUR_ENERGY_LAYOUT, INZHUR_REIT_LAYOUT } from '../../harness/inzhur/inzhur-fund-layouts';
import { ENERGY_PRICE, FIRST_URI, REIT_PRICE } from '../../harness/inzhur/inzhur-statement-fixtures.constant';
import { makeInzhurGainLayer } from '../../harness/inzhur/make-inzhur-gain-layer';
import { seedInzhurPrice } from '../../harness/inzhur/seed-inzhur-price';
import { setUpInzhurWithBaseline } from '../../harness/inzhur/set-up-inzhur-with-baseline';

const FIRST_DAY = '2026-09-30';
const BASELINE_AT = '2026-09-30T12:00:00.000Z';
const MILLISECONDS_PER_DAY = 86_400_000;
const POST_BASELINE_AT = new Date(Date.now() + MILLISECONDS_PER_DAY);
const TODAY = new Date(Date.now() + 2 * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
const UAH_INSTRUMENT_ID = 1;
const TOP_UP_DESCRIPTION = 'ТОВ "Інжур Кепітал"';

const layer = makeInzhurGainLayer(1000, 2);

const seedHistory = Effect.fnUntraced(function* () {
    const bankAccount = yield* seed.account({
        title: 'Monobank Card',
        externalId: 'inzhur-history-card',
        externalSource: ExternalSourceEnum.MONOBANK,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: UAH_INSTRUMENT_ID
    });

    yield* importInzhurBankTransaction(bankAccount.id, 'old-top-up', TOP_UP_DESCRIPTION, -5000, new Date('2026-08-15T10:00:00Z'));
    yield* importInzhurBankTransaction(bankAccount.id, 'older-top-up', TOP_UP_DESCRIPTION, -3000, new Date('2026-09-10T10:00:00Z'));
    yield* importInzhurBankTransaction(bankAccount.id, 'old-withdrawal', TOP_UP_DESCRIPTION, 1000, new Date('2026-09-12T10:00:00Z'), {
        comment: 'Повернення коштів з брокерського рахунку'
    });

    return bankAccount;
});

const seedPrices = (reitPrice: number) =>
    Effect.all([
        seedInzhurPrice(INZHUR_REIT_LAYOUT.isin, FIRST_DAY, reitPrice),
        seedInzhurPrice(INZHUR_ENERGY_LAYOUT.isin, FIRST_DAY, ENERGY_PRICE)
    ]);

const getReport = Effect.flatMap(InzhurGainService, service => service.getInstitutionReport(TODAY));

describe('inzhur/gain with history before tracking', () => {
    it.effect('moves the correction to the baseline statement date on the first import', () =>
        Effect.gen(function* () {
            yield* seedHistory();
            yield* Effect.flatMap(InzhurSetupService, service => service.setup(100));

            const [beforeImport] = yield* fetchBeforeTrackingCorrections;

            expect(beforeImport.operatedAt.getTime()).toBeGreaterThan(new Date(BASELINE_AT).getTime());

            yield* importInzhurStatement(FIRST_URI);

            expect(yield* fetchBeforeTrackingCorrections).toMatchObject([{ operatedAt: new Date(BASELINE_AT) }]);
        }).pipe(Effect.provide(layer))
    );

    it.effect('reports only the price-driven change as gain and keeps cash at the entered amount', () =>
        Effect.gen(function* () {
            yield* seedHistory();
            const { cashAccount } = yield* setUpInzhurWithBaseline(100, 1000, 2);

            yield* seedPrices(REIT_PRICE - 1);
            const report = yield* getReport;
            const allTime = report?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL);

            expect(allTime).toMatchObject({
                startValue: 100 + 1000 * (REIT_PRICE - 1) + 2 * ENERGY_PRICE,
                contributions: 0,
                gain: 1000
            });
            expect(report?.gainSeries.at(0)).toEqual({ date: FIRST_DAY, value: 0 });
            expect(report?.gainSeries.every(point => point.value >= 0)).toBe(true);
            expect(report?.gainSeries.at(-1)?.value).toBe(1000);
            expect(yield* fetchAccountBalance(cashAccount.id)).toBe(100 * PRECISION);
        }).pipe(Effect.provide(layer))
    );

    it.effect('still counts a top-up made after the baseline as a contribution, not gain', () =>
        Effect.gen(function* () {
            const bankAccount = yield* seedHistory();

            yield* setUpInzhurWithBaseline(100, 1000, 2);
            yield* seedPrices(REIT_PRICE);
            yield* importInzhurBankTransaction(bankAccount.id, 'new-top-up', TOP_UP_DESCRIPTION, -400, POST_BASELINE_AT);
            yield* Effect.flatMap(TransferConsolidationService, service => service.consolidate(null));

            const allTime = (yield* getReport)?.gains.find(gain => gain.range === InzhurGainRangeEnum.ALL);

            expect(allTime).toMatchObject({ contributions: 400, gain: 0 });
        }).pipe(Effect.provide(layer))
    );
});
