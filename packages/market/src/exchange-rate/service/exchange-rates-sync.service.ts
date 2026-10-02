import { Db, InstrumentPriceProviderEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import * as Arr from 'effect/Array';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { fetchJson } from '../../@generic/util/fetch-json.util';
import { ExchangeRateRepository } from '../repository/exchange-rate.repository';

import { ExchangeRatesService } from './exchange-rates.service';

import type { ExchangeRateCreateEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

export class ExchangeRatesSyncService extends Context.Service<ExchangeRatesSyncService>()('@budgie/market/ExchangeRatesSyncService', {
    make: Effect.gen(function* () {
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const coingeckoSimplePriceApiUrl = 'https://api.coingecko.com/api/v3/simple/price';
        const exchangeRateApiUrl = 'https://api.exchangerate-api.com/v4/latest';
        const cryptoRateSyncBatchSize = 40;
        const fetchTimeoutMs = 5000;
        const syncCooldownMs = 5 * 60 * 1000;
        const exchangeRateApiResponseSchema = Schema.Struct({
            base: Schema.String,
            date: Schema.String,
            rates: Schema.Record(Schema.String, Schema.Number)
        });
        const coinGeckoSimplePriceResponseSchema = Schema.Record(Schema.String, Schema.Record(Schema.String, Schema.Number));
        const syncPermit = yield* Semaphore.make(1);
        const lastSyncedAtMs = yield* Ref.make<number | null>(null);

        const buildRatePairInputs = (
            baseInstrumentId: number,
            quoteInstrumentId: number,
            rate: number,
            source: string
        ): ExchangeRateCreateEntityInterface[] => [
            { baseInstrumentId, quoteInstrumentId, rate, source },
            { baseInstrumentId: quoteInstrumentId, quoteInstrumentId: baseInstrumentId, rate: 1 / rate, source }
        ];

        const syncFiatRates = Effect.fn('ExchangeRatesSyncService.syncFiatRates')(function* (baseInstrument: InstrumentEntityInterface) {
            const rates = yield* fetchJson(
                `${exchangeRateApiUrl}/${baseInstrument.code}`,
                exchangeRateApiResponseSchema,
                fetchTimeoutMs
            ).pipe(
                Effect.map(apiData => apiData.rates),
                Effect.orElseSucceed((): Record<string, number> => ({ USD: 1 }))
            );
            const instruments = yield* instrumentRepository.findByType(InstrumentTypeEnum.FIAT);
            const inputs = instruments.flatMap(instrument => {
                const rate = rates[instrument.code];

                return instrument.code === baseInstrument.code || !isPositiveNumber(rate)
                    ? []
                    : buildRatePairInputs(baseInstrument.id, instrument.id, rate, 'exchangerate-api.com');
            });

            yield* Db.transaction(exchangeRateRepository.bulkUpsert(inputs));
        });

        const syncCryptoRateBatch = Effect.fn('ExchangeRatesSyncService.syncCryptoRateBatch')(function* (
            baseInstrument: InstrumentEntityInterface,
            instruments: InstrumentEntityInterface[]
        ) {
            const providerInstrumentIds = [...new Set(instruments.map(instrument => instrument.providerInstrumentId).filter(isDefined))];

            if (!isNotEmptyArray(providerInstrumentIds)) {
                return;
            }

            const quoteCode = baseInstrument.code.toLowerCase();
            const prices = yield* fetchJson(coingeckoSimplePriceApiUrl, coinGeckoSimplePriceResponseSchema, fetchTimeoutMs, {
                ids: providerInstrumentIds.join(','),
                vs_currencies: quoteCode
            }).pipe(Effect.orElseSucceed((): Record<string, Record<string, number>> => ({})));
            const inputs = instruments.flatMap(instrument => {
                const price = isDefined(instrument.providerInstrumentId) ? prices[instrument.providerInstrumentId]?.[quoteCode] : null;

                return isPositiveNumber(price) ? buildRatePairInputs(instrument.id, baseInstrument.id, price, 'coingecko.com') : [];
            });

            yield* Db.transaction(exchangeRateRepository.bulkUpsert(inputs));
        });

        const syncCryptoRates = Effect.fn('ExchangeRatesSyncService.syncCryptoRates')(function* (
            baseInstrument: InstrumentEntityInterface
        ) {
            const instruments = yield* instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
                InstrumentTypeEnum.CRYPTO,
                InstrumentPriceProviderEnum.COINGECKO
            );

            yield* Effect.forEach(
                Arr.chunksOf(instruments, cryptoRateSyncBatchSize),
                batch => syncCryptoRateBatch(baseInstrument, batch).pipe(Effect.andThen(Effect.sleep(1))),
                { discard: true }
            );
        });

        return {
            sync: Effect.fn('ExchangeRatesSyncService.sync')(
                function* () {
                    const lastSyncedAt = yield* Ref.get(lastSyncedAtMs);

                    if (isDefined(lastSyncedAt) && (yield* Clock.currentTimeMillis) - lastSyncedAt < syncCooldownMs) {
                        return;
                    }

                    const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                    if (!isDefined(baseInstrument)) {
                        return;
                    }

                    yield* syncFiatRates(baseInstrument);
                    yield* Effect.sleep(1);
                    yield* syncCryptoRates(baseInstrument);
                    yield* Ref.set(lastSyncedAtMs, yield* Clock.currentTimeMillis);
                },
                syncPermit.withPermitsIfAvailable(1),
                Effect.asVoid
            )
        };
    })
}) {
    static readonly layer = Layer.effect(ExchangeRatesSyncService, ExchangeRatesSyncService.make).pipe(
        Layer.provide([ExchangeRateRepository.layer, InstrumentRepository.layer, ExchangeRatesService.layer])
    );
}
