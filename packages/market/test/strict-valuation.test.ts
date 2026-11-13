import { AccountTypeEnum, CurrencyEnum, InstrumentTypeEnum, PRECISION } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { requireInstrumentByCode, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const seedCoinAccount = Effect.fnUntraced(function* (code: string) {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const coin = yield* testSeedService.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });
    const account = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });

    yield* setDefaultInstrument(euro.id);

    return { euro, coin, account };
});

const writeRate = (sourceInstrumentId: number, targetInstrumentId: number, rateDate: string, rate: number) =>
    Effect.flatMap(HistoricalExchangeRateRepository, repository =>
        repository.bulkUpsert([{ sourceInstrumentId, targetInstrumentId, rateDate, rate }])
    );

const valueAt = (accountId: number, operatedAt: string) =>
    Effect.flatMap(EntryBaseValuationService, service =>
        service.valueMicroUnitEntry({ accountId, amount: 2 * PRECISION, operatedAt: new Date(operatedAt) })
    );

describe('price day', () => {
    beforeEach(() => {
        vi.stubEnv('TZ', 'Europe/Moscow');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.effect('values an entry made at 01:30 on a UTC+3 device with the price of its UTC date', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TUTC1');

            yield* writeRate(coin.id, euro.id, '2026-03-10', 100);
            yield* writeRate(coin.id, euro.id, '2026-03-11', 120);

            expect(yield* valueAt(account.id, '2026-03-10T22:30:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 100,
                baseAmount: 200 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
