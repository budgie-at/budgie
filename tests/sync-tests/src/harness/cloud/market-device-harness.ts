import { TestSeedService } from '@budgie-at/test-kit';
import { AccountTypeEnum, Db } from '@budgie/contracts';
import { HistoricalExchangeRateRepository, InstrumentDailyMarketPriceRepository, MarketPricedRevaluationService } from '@budgie/market';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import type { DB } from '@budgie/contracts';

const marketDeviceLayer = Layer.mergeAll(
    MarketPricedRevaluationService.layer,
    InstrumentDailyMarketPriceRepository.layer,
    HistoricalExchangeRateRepository.layer
);

export const onMarketDevice = <A, E>(
    database: DB,
    effect: Effect.Effect<
        A,
        E,
        Db | MarketPricedRevaluationService | InstrumentDailyMarketPriceRepository | HistoricalExchangeRateRepository
    >
) => effect.pipe(Effect.provide(marketDeviceLayer), Effect.provideService(Db, database));

const readInstrumentId = (database: DB, code: string) =>
    database.$client
        .unsafe<{ readonly id: number }>('SELECT id FROM instruments WHERE code = ?', [code])
        .pipe(Effect.map(([row]) => row.id));

export const useEuroBase = (database: DB) =>
    Effect.flatMap(readInstrumentId(database, 'EUR'), euroId =>
        database.$client.unsafe('UPDATE settings SET default_instrument_id = ?', [euroId]).pipe(Effect.as(euroId))
    );

export const seedCryptoSyncAccountOn = (database: DB) =>
    Effect.gen(function* () {
        const euroId = yield* useEuroBase(database);
        const coinId = yield* readInstrumentId(database, 'BTC');
        const account = yield* new TestSeedService(database).account({
            title: 'BTC',
            instrumentId: coinId,
            type: AccountTypeEnum.CRYPTO_SYNC
        });

        return { euroId, coinId, account };
    });

export const readOnlyEntryId = (database: DB) =>
    database.$client.unsafe<{ readonly id: number }>('SELECT id FROM transaction_entries').pipe(Effect.map(([row]) => row.id));

export const readIsApplying = (database: DB) =>
    database.$client
        .unsafe<{ readonly isApplying: number }>('SELECT COALESCE(MAX(is_applying), 0) AS isApplying FROM sync_apply_state')
        .pipe(Effect.map(([row]) => row.isApplying));
