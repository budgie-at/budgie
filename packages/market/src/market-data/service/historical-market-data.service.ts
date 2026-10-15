import {
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    Db,
    DbError,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    TransactionEntryBaseValuationRepository
} from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { fetchJson } from '../../@generic/utils/fetch-json.util';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../../valuation/service/entry-base-valuation.service';
import { InstrumentDailyMarketPriceRepository } from '../repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../repository/instrument-market-data-job.repository';

import type { MarketDataJobResultInterface } from '../interface/market-data-job-result.interface';
import type {
    AccountEntityInterface,
    HistoricalExchangeRateCreateEntityInterface,
    InstrumentDailyMarketPriceCreateEntityInterface,
    InstrumentEntityInterface,
    InstrumentMarketDataJobEntityInterface
} from '@budgie/contracts';

export class HistoricalMarketDataService extends Context.Service<HistoricalMarketDataService>()(
    '@budgie/market/HistoricalMarketDataService',
    {
        make: Effect.gen(function* () {
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const accountRepository = yield* AccountRepository;
            const transactionEntryBaseValuationRepository = yield* TransactionEntryBaseValuationRepository;
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const dataWindowDays = 365;
            const frankfurterApiUrl = 'https://api.frankfurter.dev/v2';
            const maxFiatRateGapDays = 7;
            const frankfurterCurrenciesResponseSchema = Schema.Array(Schema.Struct({ iso_code: Schema.String }));
            const frankfurterRatesResponseSchema = Schema.Array(
                Schema.Struct({
                    date: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u)),
                    quote: Schema.String,
                    rate: Schema.Number
                })
            );
            const coinGeckoCoinsApiUrl = 'https://api.coingecko.com/api/v3/coins';
            const fetchTimeoutMs = 10_000;
            const maxAttempts = 3;
            const source = 'coingecko.com';
            const rateDateFormat = 'yyyy-MM-dd';
            const staleLockMs = 5 * 60 * 1000;
            const coinGeckoTimedValueSchema = Schema.Tuple([Schema.Number, Schema.Number]);
            const coinGeckoMarketChartResponseSchema = Schema.Struct({
                prices: Schema.Array(coinGeckoTimedValueSchema),
                market_caps: Schema.Array(coinGeckoTimedValueSchema),
                total_volumes: Schema.Array(coinGeckoTimedValueSchema)
            });

            const isSupportedInstrument = (instrument: InstrumentEntityInterface | undefined): boolean =>
                isDefined(instrument) &&
                instrument.type === InstrumentTypeEnum.CRYPTO &&
                instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO &&
                isDefined(instrument.providerInstrumentId);

            const getCandidateInstrumentIds = (
                accounts: AccountEntityInterface[],
                instrumentById: Map<number, InstrumentEntityInterface>
            ): number[] => {
                const uniqueInstrumentIds = new Set<number>();

                for (const account of accounts) {
                    const isCandidate = account.type === AccountTypeEnum.CRYPTO && !uniqueInstrumentIds.has(account.instrumentId);

                    if (isCandidate && isSupportedInstrument(instrumentById.get(account.instrumentId))) {
                        uniqueInstrumentIds.add(account.instrumentId);
                    }
                }

                return [...uniqueInstrumentIds];
            };

            const getSupportedFromDate = (fromDate: string): string => {
                const earliestDate = subDays(new Date(), dataWindowDays - 1);
                const requestedDate = parseISO(fromDate);
                const supportedDate = isAfter(requestedDate, earliestDate) ? requestedDate : earliestDate;

                return format(supportedDate, rateDateFormat);
            };

            const buildHistoricalRateInputs = (
                prices: InstrumentDailyMarketPriceCreateEntityInterface[]
            ): HistoricalExchangeRateCreateEntityInterface[] =>
                prices.flatMap(price => [
                    {
                        sourceInstrumentId: price.instrumentId,
                        targetInstrumentId: price.quoteInstrumentId,
                        rateDate: price.priceDate,
                        rate: price.price
                    },
                    {
                        sourceInstrumentId: price.quoteInstrumentId,
                        targetInstrumentId: price.instrumentId,
                        rateDate: price.priceDate,
                        rate: 1 / price.price
                    }
                ]);

            const buildTimedValueMap = (values: ReadonlyArray<readonly [number, number]>): Map<string, number> =>
                new Map(values.map(([timestamp, value]) => [format(new Date(timestamp), rateDateFormat), value]));

            const getNextMissingFromDate = Effect.fn('HistoricalMarketDataService.getNextMissingFromDate')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const latestPrice = yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId);

                if (isDefined(latestPrice)) {
                    return format(addDays(parseISO(latestPrice.priceDate), 1), rateDateFormat);
                }

                return format(subDays(new Date(), dataWindowDays - 1), rateDateFormat);
            });

            const buildAccountJobInput = Effect.fn('HistoricalMarketDataService.buildAccountJobInput')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const toDate = format(new Date(), rateDateFormat);
                const hasOpenJob = yield* instrumentMarketDataJobRepository.hasOpen(instrumentId, quoteInstrumentId);

                if (hasOpenJob) {
                    return null;
                }

                const fromDate = yield* getNextMissingFromDate(instrumentId, quoteInstrumentId);

                if (isAfter(parseISO(fromDate), parseISO(toDate))) {
                    return null;
                }

                return {
                    instrumentId,
                    quoteInstrumentId,
                    fromDate,
                    toDate,
                    priority: 10
                };
            });

            const fetchHistoricalPrices = Effect.fn('HistoricalMarketDataService.fetchHistoricalPrices')(function* (
                instrument: InstrumentEntityInterface,
                job: InstrumentMarketDataJobEntityInterface
            ) {
                if (!isDefined(instrument.providerInstrumentId)) {
                    return [];
                }

                const quoteCode = (yield* instrumentRepository.findById(job.quoteInstrumentId))?.code.toLowerCase() ?? 'usd';
                const fromDate = getSupportedFromDate(job.fromDate);

                if (isAfter(parseISO(fromDate), parseISO(job.toDate))) {
                    return [];
                }

                const data = yield* fetchJson(
                    `${coinGeckoCoinsApiUrl}/${encodeURIComponent(instrument.providerInstrumentId)}/market_chart/range`,
                    coinGeckoMarketChartResponseSchema,
                    fetchTimeoutMs,
                    {
                        vs_currency: quoteCode,
                        from: Math.floor(parseISO(fromDate).getTime() / 1000),
                        to: Math.floor(parseISO(job.toDate).getTime() / 1000)
                    }
                );

                if (!isNotEmptyArray(data.prices)) {
                    return yield* Effect.die(new Error('Market data prices missing'));
                }

                const marketCapByDate = buildTimedValueMap(data.market_caps);
                const volumeByDate = buildTimedValueMap(data.total_volumes);

                return data.prices.flatMap(([timestamp, price]): InstrumentDailyMarketPriceCreateEntityInterface[] => {
                    const priceDate = format(new Date(timestamp), rateDateFormat);

                    if (!isPositiveNumber(price)) {
                        return [];
                    }

                    return [
                        {
                            instrumentId: job.instrumentId,
                            quoteInstrumentId: job.quoteInstrumentId,
                            priceDate,
                            price,
                            marketCap: marketCapByDate.get(priceDate) ?? null,
                            volume: volumeByDate.get(priceDate) ?? null,
                            source
                        }
                    ];
                });
            });

            const getToday = Effect.map(Clock.currentTimeMillis, now => format(now, rateDateFormat));

            const getHeldFiatInstruments = Effect.fn('HistoricalMarketDataService.getHeldFiatInstruments')(function* () {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();
                const euroInstrument = yield* instrumentRepository.findByCode(CurrencyEnum.EUR);

                if (!isDefined(baseInstrument) || !isDefined(euroInstrument)) {
                    return null;
                }

                const accounts = yield* accountRepository.getAllActiveAccounts();
                const heldInstrumentIds = new Set([baseInstrument.id, ...accounts.map(account => account.instrumentId)]);
                const fiatInstruments = yield* instrumentRepository.findByType(InstrumentTypeEnum.FIAT);

                return {
                    euroInstrument,
                    instruments: fiatInstruments.filter(
                        instrument => heldInstrumentIds.has(instrument.id) && instrument.id !== euroInstrument.id
                    )
                };
            });

            const getFiatFromDate = Effect.fn('HistoricalMarketDataService.getFiatFromDate')(function* (
                instruments: InstrumentEntityInterface[],
                euroInstrumentId: number,
                today: string
            ) {
                const windowStartDate = format(subDays(parseISO(today), dataWindowDays - 1), rateDateFormat);
                const gapStartDates = yield* Effect.forEach(
                    instruments,
                    instrument =>
                        historicalExchangeRateRepository.findGapStartDate(
                            instrument.id,
                            euroInstrumentId,
                            windowStartDate,
                            maxFiatRateGapDays
                        ),
                    { concurrency: 'unbounded' }
                );

                return gapStartDates
                    .map(gapStartDate =>
                        isDefined(gapStartDate) ? format(addDays(parseISO(gapStartDate), 1), rateDateFormat) : windowStartDate
                    )
                    .toSorted()
                    .at(0);
            });

            const buildFiatJobInput = Effect.fn('HistoricalMarketDataService.buildFiatJobInput')(function* () {
                const heldFiatInstruments = yield* getHeldFiatInstruments();

                if (!isDefined(heldFiatInstruments) || !isNotEmptyArray(heldFiatInstruments.instruments)) {
                    return null;
                }

                const { euroInstrument, instruments } = heldFiatInstruments;

                if (yield* instrumentMarketDataJobRepository.hasOpen(euroInstrument.id, euroInstrument.id)) {
                    return null;
                }

                const toDate = yield* getToday;
                const fromDate = yield* getFiatFromDate(instruments, euroInstrument.id, toDate);

                if (!isDefined(fromDate) || isAfter(parseISO(fromDate), parseISO(toDate))) {
                    return null;
                }

                return { instrumentId: euroInstrument.id, quoteInstrumentId: euroInstrument.id, fromDate, toDate, priority: 10 };
            });

            const fetchHistoricalFiatRates = Effect.fn('HistoricalMarketDataService.fetchHistoricalFiatRates')(function* (
                job: InstrumentMarketDataJobEntityInterface
            ) {
                const heldFiatInstruments = yield* getHeldFiatInstruments();
                const instruments = heldFiatInstruments?.instruments ?? [];
                const currencies = yield* fetchJson(`${frankfurterApiUrl}/currencies`, frankfurterCurrenciesResponseSchema, fetchTimeoutMs);
                const supportedCodes = new Set(currencies.map(currency => currency.iso_code));
                const supportedInstruments = instruments.filter(instrument => supportedCodes.has(instrument.code));
                const instrumentIdByCode = new Map(supportedInstruments.map(instrument => [instrument.code, instrument.id]));
                const rates = isNotEmptyArray(supportedInstruments)
                    ? yield* fetchJson(`${frankfurterApiUrl}/rates`, frankfurterRatesResponseSchema, fetchTimeoutMs, {
                          base: CurrencyEnum.EUR,
                          quotes: supportedInstruments.map(instrument => instrument.code).join(','),
                          from: job.fromDate,
                          to: job.toDate
                      })
                    : [];
                const result: MarketDataJobResultInterface = {
                    prices: [],
                    rates: rates.flatMap(({ date, quote, rate }) => {
                        const sourceInstrumentId = instrumentIdByCode.get(quote);

                        return isDefined(sourceInstrumentId) && isPositiveNumber(rate)
                            ? [{ sourceInstrumentId, targetInstrumentId: job.quoteInstrumentId, rateDate: date, rate: 1 / rate }]
                            : [];
                    }),
                    unsupportedCurrencyCodes: instruments
                        .filter(instrument => !supportedCodes.has(instrument.code))
                        .map(instrument => instrument.code)
                };

                return result;
            });

            const revalueEntriesAround = Effect.fn('HistoricalMarketDataService.revalueEntriesAround')(function* (
                job: InstrumentMarketDataJobEntityInterface,
                writeRates: Effect.Effect<void, DbError, Db>
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return yield* writeRates;
                }

                const buckets = (yield* transactionEntryBaseValuationRepository.findBaseValuationBucketsInRange(
                    baseInstrument.id,
                    job.fromDate,
                    job.toDate
                )).filter(bucket => bucket.sourceInstrumentId !== baseInstrument.id);
                const resolveBucketRates = Effect.forEach(buckets, bucket =>
                    entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                        bucket.sourceInstrumentId,
                        baseInstrument.id,
                        parseISO(bucket.rateDate)
                    )
                );
                const previousRates = yield* resolveBucketRates;

                yield* writeRates;

                const nextRates = yield* resolveBucketRates;

                yield* Effect.forEach(
                    buckets,
                    (bucket, index) => {
                        const previousBaseExchangeRate = previousRates[index];
                        const baseExchangeRate = nextRates[index];

                        return isDefined(previousBaseExchangeRate) &&
                            isDefined(baseExchangeRate) &&
                            previousBaseExchangeRate !== baseExchangeRate
                            ? transactionEntryBaseValuationRepository.revalueBaseValuationBucket({
                                  rateDate: bucket.rateDate,
                                  sourceInstrumentId: bucket.sourceInstrumentId,
                                  baseInstrumentId: baseInstrument.id,
                                  previousBaseExchangeRate,
                                  baseExchangeRate
                              })
                            : Effect.void;
                    },
                    { discard: true }
                );
            });

            const enqueueAccounts = Effect.fn('HistoricalMarketDataService.enqueueAccounts')(function* (
                accounts: AccountEntityInterface[]
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return;
                }

                const instruments = yield* instrumentRepository.getAll();
                const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
                const inputs = yield* Effect.forEach(
                    getCandidateInstrumentIds(accounts, instrumentById),
                    instrumentId => buildAccountJobInput(instrumentId, baseInstrument.id),
                    { concurrency: 'unbounded' }
                );

                yield* instrumentMarketDataJobRepository.enqueueMany([...inputs, yield* buildFiatJobInput()].filter(isDefined));
            });

            return {
                enqueueAccounts,
                claimNextJob: () => instrumentMarketDataJobRepository.claimNext(maxAttempts, new Date(Date.now() - staleLockMs)),
                fetchJobData: Effect.fn('HistoricalMarketDataService.fetchJobData')(function* (
                    job: InstrumentMarketDataJobEntityInterface
                ) {
                    const instrument = yield* instrumentRepository.findById(job.instrumentId);

                    if (!isDefined(instrument)) {
                        return yield* Effect.die(new Error('Instrument not found'));
                    }

                    if (instrument.type === InstrumentTypeEnum.FIAT) {
                        return yield* fetchHistoricalFiatRates(job);
                    }

                    const prices = yield* fetchHistoricalPrices(instrument, job);
                    const result: MarketDataJobResultInterface = {
                        prices,
                        rates: buildHistoricalRateInputs(prices),
                        unsupportedCurrencyCodes: []
                    };

                    return result;
                }),
                storeJobData: Effect.fn('HistoricalMarketDataService.storeJobData')(function* (
                    job: InstrumentMarketDataJobEntityInterface,
                    result: MarketDataJobResultInterface
                ) {
                    const instrument = yield* instrumentRepository.findById(job.instrumentId);
                    const writeRates = historicalExchangeRateRepository.bulkUpsert(result.rates);

                    yield* Db.transaction(
                        Effect.all(
                            [
                                instrumentDailyMarketPriceRepository.bulkUpsert(result.prices),
                                instrument?.type === InstrumentTypeEnum.FIAT ? revalueEntriesAround(job, writeRates) : writeRates,
                                instrumentMarketDataJobRepository.markCompleted(job.id)
                            ],
                            { discard: true }
                        )
                    );
                }),
                failJob: (job: InstrumentMarketDataJobEntityInterface, cause: Cause.Cause<unknown>) =>
                    instrumentMarketDataJobRepository.markFailed(job.id, getErrorMessage(Cause.squash(cause)))
            };
        })
    }
) {
    static readonly layer = Layer.effect(HistoricalMarketDataService, HistoricalMarketDataService.make).pipe(
        Layer.provide([
            HistoricalExchangeRateRepository.layer,
            InstrumentDailyMarketPriceRepository.layer,
            InstrumentMarketDataJobRepository.layer,
            InstrumentRepository.layer,
            ExchangeRatesService.layer,
            AccountRepository.layer,
            TransactionEntryBaseValuationRepository.layer,
            EntryBaseValuationService.layer
        ])
    );
}
