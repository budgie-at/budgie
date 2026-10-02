import { Db, ExchangeRateRepository, InstrumentPriceProviderEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';
import * as Schedule from 'effect/Schedule';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';
import { CoinGeckoSimplePriceResponseSchema } from '../schema/coin-gecko-simple-price-response.schema';
import { ExchangeRateApiResponseSchema } from '../schema/exchange-rate-api-response.schema';

import { ExchangeRatesService } from './exchange-rates.service';

import type { ExchangeRateCreateEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Schema from 'effect/Schema';

export class ExchangeRatesSyncService extends Context.Service<ExchangeRatesSyncService>()('@budgie/app/ExchangeRatesSyncService', {
    make: Effect.gen(function* () {
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const appVariantExtraKey = 'appVariant';
        const backgroundTaskMinimumIntervalMinutes = 60;
        const coingeckoSimplePriceApiUrl = 'https://api.coingecko.com/api/v3/simple/price';
        const e2eAppVariant = 'e2e';
        const exchangeRateApiUrl = 'https://api.exchangerate-api.com/v4/latest';
        const cryptoRateSyncBatchSize = 40;
        const fetchTimeoutMs = 5000;
        const fetchRetryLimit = 1;
        const fetchRetryDelayMs = 300;
        const syncCooldownMs = 5 * 60 * 1000;
        let isSyncing = false;
        let lastSyncedAtMs: number | null = null;

        const isE2EApp = (): boolean => Constants.expoConfig?.extra?.[appVariantExtraKey] === e2eAppVariant;

        const getCryptoPrice = (
            prices: Partial<Record<string, Partial<Record<string, number>>>>,
            providerInstrumentId: string | null,
            quoteCode: string
        ): number | null => {
            if (!isDefined(providerInstrumentId)) {
                return null;
            }

            const price = prices[providerInstrumentId]?.[quoteCode];

            return isDefined(price) ? price : null;
        };

        const buildRatePairInputs = (
            baseInstrumentId: number,
            quoteInstrumentId: number,
            rate: number,
            source: string
        ): ExchangeRateCreateEntityInterface[] => [
            {
                baseInstrumentId,
                quoteInstrumentId,
                rate,
                source
            },
            {
                baseInstrumentId: quoteInstrumentId,
                quoteInstrumentId: baseInstrumentId,
                rate: 1 / rate,
                source
            }
        ];

        const buildInstrumentRateInputs = (
            baseInstrumentId: number,
            instrument: { id: number; code: string },
            rates: Record<string, number>,
            source: string
        ): ExchangeRateCreateEntityInterface[] => {
            const rate = rates[instrument.code];

            if (!isPositiveNumber(rate)) {
                return [];
            }

            return buildRatePairInputs(baseInstrumentId, instrument.id, rate, source);
        };

        const buildCryptoInstrumentRateInputs = (
            baseInstrumentId: number,
            instrument: InstrumentEntityInterface,
            rate: number | null
        ): ExchangeRateCreateEntityInterface[] => {
            if (!isPositiveNumber(rate)) {
                return [];
            }

            return buildRatePairInputs(instrument.id, baseInstrumentId, rate, 'coingecko.com');
        };

        const fetchJson = Effect.fn('ExchangeRatesSyncService.fetchJson')(function* <S extends Schema.ConstraintDecoder<unknown>>(
            url: string,
            schema: S,
            fallback: S['Type']
        ) {
            const client = (yield* HttpClient.HttpClient).pipe(
                HttpClient.filterStatusOk,
                HttpClient.transformResponse(Effect.timeout(fetchTimeoutMs)),
                HttpClient.retryTransient({
                    retryOn: 'errors-only',
                    times: fetchRetryLimit,
                    schedule: Schedule.exponential(fetchRetryDelayMs)
                })
            );

            return yield* client.get(url).pipe(
                Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
                Effect.orElseSucceed(() => fallback)
            );
        });

        const syncFiatRates = Effect.fn('ExchangeRatesSyncService.syncFiatRates')(function* (baseInstrument: InstrumentEntityInterface) {
            const apiData = yield* fetchJson(
                `${exchangeRateApiUrl}/${baseInstrument.code}`,
                ExchangeRateApiResponseSchema,
                emptyExchangeRateApiResponse
            );
            const instruments = yield* instrumentRepository.findByType(InstrumentTypeEnum.FIAT);
            const inputs = instruments.flatMap(instrument =>
                instrument.code === baseInstrument.code
                    ? []
                    : buildInstrumentRateInputs(baseInstrument.id, instrument, apiData.rates, 'exchangerate-api.com')
            );

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

            const ids = providerInstrumentIds.map(encodeURIComponent).join(',');
            const quoteCode = baseInstrument.code.toLowerCase();
            const prices = yield* fetchJson(
                `${coingeckoSimplePriceApiUrl}?ids=${ids}&vs_currencies=${encodeURIComponent(quoteCode)}`,
                CoinGeckoSimplePriceResponseSchema,
                {}
            );
            const inputs = instruments.flatMap(instrument =>
                buildCryptoInstrumentRateInputs(
                    baseInstrument.id,
                    instrument,
                    getCryptoPrice(prices, instrument.providerInstrumentId, quoteCode)
                )
            );

            if (!isNotEmptyArray(inputs)) {
                return;
            }

            yield* Db.transaction(exchangeRateRepository.bulkUpsert(inputs));
        });

        const syncCryptoRates = Effect.fn('ExchangeRatesSyncService.syncCryptoRates')(function* (
            baseInstrument: InstrumentEntityInterface
        ) {
            const instruments = yield* instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
                InstrumentTypeEnum.CRYPTO,
                InstrumentPriceProviderEnum.COINGECKO
            );

            if (!isNotEmptyArray(instruments)) {
                return;
            }

            yield* processInputWithBatches(instruments, cryptoRateSyncBatchSize, batch =>
                syncCryptoRateBatch(baseInstrument, batch).pipe(Effect.as(null))
            );
        });

        const syncInner = Effect.fn('ExchangeRatesSyncService.syncInner')(function* () {
            if (isDefined(lastSyncedAtMs) && Date.now() - lastSyncedAtMs < syncCooldownMs) {
                return;
            }

            const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

            if (!isDefined(baseInstrument)) {
                return;
            }

            yield* syncFiatRates(baseInstrument);
            yield* YIELD_TO_UI;
            yield* syncCryptoRates(baseInstrument);
            yield* Effect.sync(() => {
                lastSyncedAtMs = Date.now();
            });
        });

        return {
            registerBackgroundTask: Effect.fn('ExchangeRatesSyncService.registerBackgroundTask')(function* () {
                if (isE2EApp() || (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK)))) {
                    return;
                }

                yield* Effect.promise(() =>
                    BackgroundTask.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
                        minimumInterval: backgroundTaskMinimumIntervalMinutes
                    })
                );
            }),
            sync: Effect.fn('ExchangeRatesSyncService.sync')(function* () {
                if (isE2EApp() || isSyncing) {
                    return;
                }

                isSyncing = true;

                yield* syncInner().pipe(
                    Effect.ensuring(
                        Effect.sync(() => {
                            isSyncing = false;
                        })
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(ExchangeRatesSyncService, ExchangeRatesSyncService.make).pipe(
        Layer.provide([ExchangeRateRepository.layer, InstrumentRepository.layer, ExchangeRatesService.layer])
    );
}
