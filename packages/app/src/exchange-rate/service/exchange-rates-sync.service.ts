import { Db, InstrumentPriceProviderEnum, InstrumentTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Schedule from 'effect/Schedule';
import * as BackgroundTask from 'expo-background-task';
import Constants from 'expo-constants';
import * as TaskManager from 'expo-task-manager';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_TO_UI } from '../../@generic/constant/yield-to-ui.constant';
import { exchangeRateRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { processInputWithBatches } from '../../@generic/utils/process-input-with-batches.util';
import { EXCHANGE_RATE_SYNC_TASK } from '../constant/exchange-rate-sync-task.constant';
import { emptyExchangeRateApiResponse } from '../interface/exchange-rate-api-response.interface';
import { CoinGeckoSimplePriceResponseSchema } from '../schema/coin-gecko-simple-price-response.schema';
import { ExchangeRateApiResponseSchema } from '../schema/exchange-rate-api-response.schema';

import { exchangeRatesService } from './exchange-rates.service';

import type { ExchangeRateCreateEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';
import type * as Schema from 'effect/Schema';

class ExchangeRatesSyncService {
    private static readonly APP_VARIANT_EXTRA_KEY = 'appVariant';
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 60;
    private static readonly COINGECKO_SIMPLE_PRICE_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
    private static readonly E2E_APP_VARIANT = 'e2e';
    private static readonly EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest';
    private static readonly CRYPTO_RATE_SYNC_BATCH_SIZE = 40;
    private static readonly FETCH_TIMEOUT_MS = 5000;
    private static readonly FETCH_RETRY_LIMIT = 1;
    private static readonly FETCH_RETRY_DELAY_MS = 300;
    private static readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000;

    readonly registerBackgroundTask = Effect.fn('ExchangeRatesSyncService.registerBackgroundTask')(
        function* (this: ExchangeRatesSyncService) {
            if (this.isE2EApp() || (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(EXCHANGE_RATE_SYNC_TASK)))) {
                return;
            }

            yield* Effect.promise(() =>
                BackgroundTask.registerTaskAsync(EXCHANGE_RATE_SYNC_TASK, {
                    minimumInterval: ExchangeRatesSyncService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
                })
            );
        }
    );

    readonly sync = Effect.fn('ExchangeRatesSyncService.sync')(function* (this: ExchangeRatesSyncService) {
        if (this.isE2EApp() || this.isSyncing) {
            return;
        }

        this.isSyncing = true;

        yield* this.syncInner().pipe(
            Effect.ensuring(
                Effect.sync(() => {
                    this.isSyncing = false;
                })
            )
        );
    });

    private readonly syncInner = Effect.fn('ExchangeRatesSyncService.syncInner')(function* (this: ExchangeRatesSyncService) {
        if (isDefined(this.lastSyncedAtMs) && Date.now() - this.lastSyncedAtMs < ExchangeRatesSyncService.SYNC_COOLDOWN_MS) {
            return;
        }

        const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

        if (!isDefined(baseInstrument)) {
            return;
        }

        yield* this.syncFiatRates(baseInstrument);
        yield* YIELD_TO_UI;
        yield* this.syncCryptoRates(baseInstrument);
        this.lastSyncedAtMs = Date.now();
    });

    private readonly syncFiatRates = Effect.fn('ExchangeRatesSyncService.syncFiatRates')(function* (
        this: ExchangeRatesSyncService,
        baseInstrument: InstrumentEntityInterface
    ) {
        const apiData = yield* this.fetchJson(
            `${ExchangeRatesSyncService.EXCHANGE_RATE_API_URL}/${baseInstrument.code}`,
            ExchangeRateApiResponseSchema,
            emptyExchangeRateApiResponse
        );
        const instruments = yield* Db.query(() => instrumentRepository.findByType(InstrumentTypeEnum.FIAT));
        const inputs = instruments.flatMap(instrument =>
            instrument.code === baseInstrument.code
                ? []
                : this.buildInstrumentRateInputs(baseInstrument.id, instrument, apiData.rates, 'exchangerate-api.com')
        );

        yield* Db.transaction(exchangeRateRepository.bulkUpsert(inputs));
    });

    private readonly syncCryptoRates = Effect.fn('ExchangeRatesSyncService.syncCryptoRates')(function* (
        this: ExchangeRatesSyncService,
        baseInstrument: InstrumentEntityInterface
    ) {
        const instruments = yield* instrumentRepository.findByTypeAndPriceProviderWithProviderInstrumentId(
            InstrumentTypeEnum.CRYPTO,
            InstrumentPriceProviderEnum.COINGECKO
        );

        if (!isNotEmptyArray(instruments)) {
            return;
        }

        yield* processInputWithBatches(instruments, ExchangeRatesSyncService.CRYPTO_RATE_SYNC_BATCH_SIZE, batch =>
            this.syncCryptoRateBatch(baseInstrument, batch).pipe(Effect.as(null))
        );
    });

    private readonly syncCryptoRateBatch = Effect.fn('ExchangeRatesSyncService.syncCryptoRateBatch')(function* (
        this: ExchangeRatesSyncService,
        baseInstrument: InstrumentEntityInterface,
        instruments: InstrumentEntityInterface[]
    ) {
        const providerInstrumentIds = [...new Set(instruments.map(instrument => instrument.providerInstrumentId).filter(isDefined))];

        if (!isNotEmptyArray(providerInstrumentIds)) {
            return;
        }

        const ids = providerInstrumentIds.map(encodeURIComponent).join(',');
        const quoteCode = baseInstrument.code.toLowerCase();
        const prices = yield* this.fetchJson(
            `${ExchangeRatesSyncService.COINGECKO_SIMPLE_PRICE_API_URL}?ids=${ids}&vs_currencies=${encodeURIComponent(quoteCode)}`,
            CoinGeckoSimplePriceResponseSchema,
            {}
        );
        const inputs = instruments.flatMap(instrument =>
            this.buildCryptoInstrumentRateInputs(
                baseInstrument.id,
                instrument,
                this.getCryptoPrice(prices, instrument.providerInstrumentId, quoteCode)
            )
        );

        if (!isNotEmptyArray(inputs)) {
            return;
        }

        yield* Db.transaction(exchangeRateRepository.bulkUpsert(inputs));
    });

    private readonly fetchJson = Effect.fn('ExchangeRatesSyncService.fetchJson')(function* <S extends Schema.ConstraintDecoder<unknown>>(
        url: string,
        schema: S,
        fallback: S['Type']
    ) {
        const client = (yield* HttpClient.HttpClient).pipe(
            HttpClient.filterStatusOk,
            HttpClient.transformResponse(Effect.timeout(ExchangeRatesSyncService.FETCH_TIMEOUT_MS)),
            HttpClient.retryTransient({
                retryOn: 'errors-only',
                times: ExchangeRatesSyncService.FETCH_RETRY_LIMIT,
                schedule: Schedule.exponential(ExchangeRatesSyncService.FETCH_RETRY_DELAY_MS)
            })
        );

        return yield* client.get(url).pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(schema)),
            Effect.orElseSucceed(() => fallback)
        );
    });

    private isSyncing = false;
    private lastSyncedAtMs: number | null = null;

    private isE2EApp(): boolean {
        return Constants.expoConfig?.extra?.[ExchangeRatesSyncService.APP_VARIANT_EXTRA_KEY] === ExchangeRatesSyncService.E2E_APP_VARIANT;
    }

    private getCryptoPrice(
        prices: Partial<Record<string, Partial<Record<string, number>>>>,
        providerInstrumentId: string | null,
        quoteCode: string
    ): number | null {
        if (!isDefined(providerInstrumentId)) {
            return null;
        }

        const price = prices[providerInstrumentId]?.[quoteCode];

        return isDefined(price) ? price : null;
    }

    private buildInstrumentRateInputs(
        baseInstrumentId: number,
        instrument: { id: number; code: string },
        rates: Record<string, number>,
        source: string
    ): ExchangeRateCreateEntityInterface[] {
        const rate = rates[instrument.code];

        if (!isPositiveNumber(rate)) {
            return [];
        }

        return this.buildRatePairInputs(baseInstrumentId, instrument.id, rate, source);
    }

    private buildCryptoInstrumentRateInputs(
        baseInstrumentId: number,
        instrument: InstrumentEntityInterface,
        rate: number | null
    ): ExchangeRateCreateEntityInterface[] {
        if (!isPositiveNumber(rate)) {
            return [];
        }

        return this.buildRatePairInputs(instrument.id, baseInstrumentId, rate, 'coingecko.com');
    }

    private buildRatePairInputs(
        baseInstrumentId: number,
        quoteInstrumentId: number,
        rate: number,
        source: string
    ): ExchangeRateCreateEntityInterface[] {
        return [
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
    }
}

export const exchangeRatesSyncService = new ExchangeRatesSyncService();
