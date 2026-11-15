import {
    AccountRepository,
    CurrencyEnum,
    Db,
    DbError,
    InstrumentMarketDataJobStatusEnum,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    TransactionEntryBaseValuationRepository
} from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { max } from 'date-fns/max';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Arr from 'effect/Array';
import * as Cause from 'effect/Cause';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Order from 'effect/Order';
import * as Schema from 'effect/Schema';

import { getErrorMessage, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { USDT_INSTRUMENT_CODE } from '../../@generic/constant/usdt-instrument-code.constant';
import { fetchJson } from '../../@generic/utils/fetch-json.util';
import { formatUtcDay } from '../../@generic/utils/format-utc-day.util';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../../valuation/service/entry-base-valuation.service';
import { MarketPricedRevaluationService } from '../../valuation/service/market-priced-revaluation.service';
import { MARKET_DATA_JOB_MAX_ATTEMPTS, MARKET_DATA_JOB_STALE_LOCK_MS } from '../constant/market-data-job-retry.constant';
import { InstrumentDailyMarketPriceRepository } from '../repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../repository/instrument-market-data-job.repository';
import { buildHistoricalRateInputs } from '../utils/build-historical-rate-inputs.util';

import { InzhurPriceService } from './inzhur-price.service';
import { KlinesHistoryService } from './klines-history.service';
import { YahooMarketDataService } from './yahoo-market-data.service';

import type { MarketDataJobResultInterface } from '../interface/market-data-job-result.interface';
import type {
    AccountEntityInterface,
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
            const inzhurPriceService = yield* InzhurPriceService;
            const marketPricedRevaluationService = yield* MarketPricedRevaluationService;
            const klinesHistoryService = yield* KlinesHistoryService;
            const yahooMarketDataService = yield* YahooMarketDataService;
            const dataWindowDays = 365;
            const frankfurterApiUrl = 'https://api.frankfurter.dev/v2';
            const maxFiatRateGapDays = 7;
            const frankfurterCurrenciesResponseSchema = Schema.Array(Schema.Struct({ iso_code: Schema.String }));
            const frankfurterRatesResponseSchema = Schema.Array(
                Schema.Struct({
                    date: Schema.String.check(Schema.isPattern(/^\d{4}-\d{2}-\d{2}$/u)),
                    quote: Schema.String,
                    rate: Schema.Finite
                })
            );
            const coinGeckoCoinsApiUrl = 'https://api.coingecko.com/api/v3/coins';
            const fetchTimeoutMs = 10_000;
            const maxAttempts = MARKET_DATA_JOB_MAX_ATTEMPTS;
            const inzhurSource = 'inzhur.reit';
            const rateDateFormat = 'yyyy-MM-dd';
            const staleLockMs = MARKET_DATA_JOB_STALE_LOCK_MS;
            const coinGeckoTimedValueSchema = Schema.Tuple([Schema.Finite, Schema.Finite]);
            const coinGeckoMarketChartResponseSchema = Schema.Struct({
                prices: Schema.Array(coinGeckoTimedValueSchema),
                market_caps: Schema.Array(coinGeckoTimedValueSchema),
                total_volumes: Schema.Array(coinGeckoTimedValueSchema)
            });

            const getStaleLockedBefore = Effect.map(DateTime.now, now => DateTime.toDateUtc(DateTime.subtractDuration(now, staleLockMs)));

            const hasOpenJob = (instrumentId: number, quoteInstrumentId: number) =>
                Effect.flatMap(getStaleLockedBefore, staleLockedBefore =>
                    instrumentMarketDataJobRepository.hasOpen(instrumentId, quoteInstrumentId, maxAttempts, staleLockedBefore)
                );

            const isPricedInstrument = (instrument: InstrumentEntityInterface | undefined): boolean =>
                isDefined(instrument) && isDefined(instrument.priceProvider) && isDefined(instrument.providerInstrumentId);

            const isCoinGeckoCrypto = (instrument: InstrumentEntityInterface | undefined): boolean =>
                isPricedInstrument(instrument) &&
                instrument?.type === InstrumentTypeEnum.CRYPTO &&
                instrument.priceProvider === InstrumentPriceProviderEnum.COINGECKO;

            const getSupportedFromDate = (fromDate: string): string =>
                format(max([parseISO(fromDate), subDays(new Date(), dataWindowDays - 1)]), rateDateFormat);

            const buildTimedValueMap = (values: ReadonlyArray<readonly [number, number]>): Map<string, number> =>
                values.reduce(
                    (valueByDay, [timestamp, value]) =>
                        valueByDay.has(formatUtcDay(new Date(timestamp)))
                            ? valueByDay
                            : valueByDay.set(formatUtcDay(new Date(timestamp)), value),
                    new Map<string, number>()
                );

            const getToday = Effect.map(Clock.currentTimeMillis, now => format(now, rateDateFormat));

            const getNextMissingFromDate = Effect.fn('HistoricalMarketDataService.getNextMissingFromDate')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const latestPrice = yield* instrumentDailyMarketPriceRepository.findLatest(instrumentId, quoteInstrumentId);

                if (isDefined(latestPrice)) {
                    return format(addDays(parseISO(latestPrice.priceDate), 1), rateDateFormat);
                }

                const now = yield* DateTime.nowAsDate;

                return format(subDays(now, dataWindowDays - 1), rateDateFormat);
            });

            const buildAccountJobInput = Effect.fn('HistoricalMarketDataService.buildAccountJobInput')(function* (
                instrumentId: number,
                quoteInstrumentId: number
            ) {
                const now = yield* DateTime.nowAsDate;
                const toDate = format(now, rateDateFormat);

                if (yield* hasOpenJob(instrumentId, quoteInstrumentId)) {
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

                const priceByDate = buildTimedValueMap(data.prices);

                return [...priceByDate].flatMap(([priceDate, price]): InstrumentDailyMarketPriceCreateEntityInterface[] =>
                    isPositiveNumber(price)
                        ? [
                              {
                                  instrumentId: job.instrumentId,
                                  quoteInstrumentId: job.quoteInstrumentId,
                                  priceDate,
                                  price,
                                  marketCap: marketCapByDate.get(priceDate) ?? null,
                                  volume: volumeByDate.get(priceDate) ?? null,
                                  source: 'coingecko.com'
                              }
                          ]
                        : []
                );
            });

            const fetchInzhurPrices = Effect.fn('HistoricalMarketDataService.fetchInzhurPrices')(function* (
                instrument: InstrumentEntityInterface,
                job: InstrumentMarketDataJobEntityInterface
            ) {
                const fundPrices = yield* inzhurPriceService.fetchPrices;
                const fundPrice = fundPrices.find(({ fundName }) => fundName.toLowerCase() === instrument.name.toLowerCase());

                if (!isDefined(fundPrice)) {
                    return [];
                }

                const sampledAt = yield* DateTime.nowAsDate;
                const price: InstrumentDailyMarketPriceCreateEntityInterface = {
                    instrumentId: job.instrumentId,
                    quoteInstrumentId: job.quoteInstrumentId,
                    priceDate: format(sampledAt, rateDateFormat),
                    price: fundPrice.price,
                    marketCap: null,
                    volume: null,
                    source: inzhurSource
                };

                return [price];
            });

            const fetchPrices = (instrument: InstrumentEntityInterface, job: InstrumentMarketDataJobEntityInterface) => {
                if (instrument.priceProvider === InstrumentPriceProviderEnum.INZHUR) {
                    return fetchInzhurPrices(instrument, job);
                }

                return instrument.priceProvider === InstrumentPriceProviderEnum.YAHOO
                    ? yahooMarketDataService.fetchDailyPrices(instrument, job)
                    : fetchHistoricalPrices(instrument, job);
            };

            const getHeldFiatInstruments = Effect.fn('HistoricalMarketDataService.getHeldFiatInstruments')(function* (
                instrumentById?: ReadonlyMap<number, InstrumentEntityInterface>
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();
                const euroInstrument = yield* instrumentRepository.findByCode(CurrencyEnum.EUR);

                if (!isDefined(baseInstrument) || !isDefined(euroInstrument)) {
                    return null;
                }

                const accounts = yield* accountRepository.getAllActiveAccounts;
                const instruments =
                    instrumentById ?? new Map((yield* instrumentRepository.getAll).map(instrument => [instrument.id, instrument]));
                const heldInstrumentIds = new Set([
                    baseInstrument.id,
                    ...accounts.map(account => account.instrumentId),
                    ...accounts
                        .map(account => instruments.get(account.instrumentId))
                        .filter(isDefined)
                        .map(instrument => instrument.quoteInstrumentId)
                ]);
                const unsupportedIds = yield* instrumentMarketDataJobRepository.findUnsupportedInstrumentIds(euroInstrument.id);
                const unsupportedInstrumentIds = new Set(unsupportedIds);
                const fiatInstruments = yield* instrumentRepository.findByType(InstrumentTypeEnum.FIAT);

                return {
                    euroInstrument,
                    instruments: fiatInstruments.filter(
                        instrument =>
                            heldInstrumentIds.has(instrument.id) &&
                            !unsupportedInstrumentIds.has(instrument.id) &&
                            instrument.id !== euroInstrument.id
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

                return Arr.sort(
                    gapStartDates.map(gapStartDate =>
                        isDefined(gapStartDate) ? format(addDays(parseISO(gapStartDate), 1), rateDateFormat) : windowStartDate
                    ),
                    Order.String
                ).at(0);
            });

            const buildFiatJobInput = Effect.fn('HistoricalMarketDataService.buildFiatJobInput')(function* (
                instrumentById: ReadonlyMap<number, InstrumentEntityInterface>
            ) {
                const heldFiatInstruments = yield* getHeldFiatInstruments(instrumentById);

                if (!isDefined(heldFiatInstruments) || !isNotEmptyArray(heldFiatInstruments.instruments)) {
                    return null;
                }

                const { euroInstrument, instruments } = heldFiatInstruments;

                if (yield* hasOpenJob(euroInstrument.id, euroInstrument.id)) {
                    return null;
                }

                const toDate = yield* getToday;
                const fromDate = yield* getFiatFromDate(instruments, euroInstrument.id, toDate);

                if (!isDefined(fromDate) || isAfter(parseISO(fromDate), parseISO(toDate))) {
                    return null;
                }

                return { instrumentId: euroInstrument.id, quoteInstrumentId: euroInstrument.id, fromDate, toDate, priority: 5 };
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

                return {
                    prices: [],
                    rates: rates.flatMap(({ date, quote, rate }) => {
                        const sourceInstrumentId = instrumentIdByCode.get(quote);

                        return isDefined(sourceInstrumentId) && isPositiveNumber(rate)
                            ? [{ sourceInstrumentId, targetInstrumentId: job.quoteInstrumentId, rateDate: date, rate: 1 / rate }]
                            : [];
                    }),
                    unsupportedInstruments: instruments.filter(instrument => !supportedCodes.has(instrument.code))
                } satisfies MarketDataJobResultInterface;
            });

            const revalueEntriesAround = Effect.fn('HistoricalMarketDataService.revalueEntriesAround')(function* (
                job: InstrumentMarketDataJobEntityInterface,
                writeRates: Effect.Effect<void, DbError, Db>
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return yield* writeRates;
                }

                const instrument = yield* instrumentRepository.findById(job.instrumentId);
                const buckets = (yield* transactionEntryBaseValuationRepository.findBaseValuationBucketsInRange(
                    baseInstrument.id,
                    job.fromDate,
                    job.toDate
                )).filter(
                    bucket =>
                        bucket.sourceInstrumentId !== baseInstrument.id &&
                        (instrument?.type === InstrumentTypeEnum.FIAT || bucket.sourceInstrumentId === job.instrumentId)
                );
                const resolveBucketRates = Effect.forEach(buckets, bucket =>
                    entryBaseValuationService.resolveHistoricalBaseExchangeRateForDay(
                        bucket.sourceInstrumentId,
                        baseInstrument.id,
                        bucket.rateDate
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
                yield* transactionEntryBaseValuationRepository.rebaseSecurityTradeCosts(baseInstrument.id);
            });

            const enqueueAccounts = Effect.fn('HistoricalMarketDataService.enqueueAccounts')(function* (
                accounts: AccountEntityInterface[]
            ) {
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return;
                }

                const instruments = yield* instrumentRepository.getAll;
                const instrumentById = new Map(instruments.map(instrument => [instrument.id, instrument]));
                const heldInstrumentIds = [...new Set(accounts.map(account => account.instrumentId))];
                const inputs = yield* Effect.forEach(
                    heldInstrumentIds.filter(instrumentId => isPricedInstrument(instrumentById.get(instrumentId))),
                    instrumentId =>
                        buildAccountJobInput(instrumentId, instrumentById.get(instrumentId)?.quoteInstrumentId ?? baseInstrument.id),
                    { concurrency: 'unbounded' }
                );
                const cryptoInstrumentIds = heldInstrumentIds.filter(instrumentId => isCoinGeckoCrypto(instrumentById.get(instrumentId)));
                const tether = yield* klinesHistoryService.findUsdtInstrument;
                const unsupportedKlinesIds = new Set(
                    isDefined(tether) ? yield* instrumentMarketDataJobRepository.findUnsupportedInstrumentIds(tether.id) : []
                );
                const klinesInputs = isDefined(tether)
                    ? yield* Effect.forEach(
                          cryptoInstrumentIds.filter(instrumentId => instrumentId !== tether.id && !unsupportedKlinesIds.has(instrumentId)),
                          instrumentId =>
                              Effect.flatMap(hasOpenJob(instrumentId, tether.id), isOpen =>
                                  isOpen
                                      ? Effect.succeed(null)
                                      : klinesHistoryService.buildJobInput(instrumentId, baseInstrument.id, tether.id)
                              )
                      )
                    : [];

                yield* instrumentMarketDataJobRepository.enqueueMany([...inputs, ...klinesInputs].filter(isDefined));
                yield* instrumentMarketDataJobRepository.enqueueMany([yield* buildFiatJobInput(instrumentById)].filter(isDefined));
            });

            return {
                enqueueAccounts,
                claimNextJob: Effect.flatMap(getStaleLockedBefore, staleLockedBefore =>
                    instrumentMarketDataJobRepository.claimNext(maxAttempts, staleLockedBefore)
                ),
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

                    const quoteInstrument = yield* instrumentRepository.findById(job.quoteInstrumentId);

                    if (instrument.type === InstrumentTypeEnum.CRYPTO && quoteInstrument?.code === USDT_INSTRUMENT_CODE) {
                        return yield* klinesHistoryService.fetchJobData(instrument, job);
                    }

                    const prices = yield* fetchPrices(instrument, job);

                    return {
                        prices,
                        rates: buildHistoricalRateInputs(prices),
                        unsupportedInstruments: []
                    } satisfies MarketDataJobResultInterface;
                }),
                storeJobData: Effect.fn('HistoricalMarketDataService.storeJobData')(function* (
                    job: InstrumentMarketDataJobEntityInterface,
                    result: MarketDataJobResultInterface
                ) {
                    const instrument = yield* instrumentRepository.findById(job.instrumentId);
                    const writeRates = historicalExchangeRateRepository.bulkUpsert(result.rates);
                    const earliestPriceDate = yield* instrumentDailyMarketPriceRepository.findEarliestPriceDate(job.instrumentId);
                    const isFirstPriceBatch = !isDefined(earliestPriceDate) || earliestPriceDate >= job.fromDate;
                    const isJobUnsupported = result.unsupportedInstruments.some(unsupported => unsupported.id === job.instrumentId);
                    const isRepairNeeded =
                        !isJobUnsupported &&
                        isDefined(instrument) &&
                        instrument.type !== InstrumentTypeEnum.FIAT &&
                        isNotEmptyArray(result.prices);
                    const markJob = isJobUnsupported
                        ? instrumentMarketDataJobRepository.markUnsupported(job)
                        : instrumentMarketDataJobRepository.markCompleted(job);
                    const writeData = Effect.all(
                        [
                            instrumentDailyMarketPriceRepository.bulkUpsert(result.prices),
                            revalueEntriesAround(job, writeRates),
                            instrumentMarketDataJobRepository.enqueueMany(
                                result.unsupportedInstruments
                                    .filter(unsupported => unsupported.id !== job.instrumentId)
                                    .map(unsupported => ({
                                        instrumentId: unsupported.id,
                                        quoteInstrumentId: job.quoteInstrumentId,
                                        fromDate: job.fromDate,
                                        toDate: job.toDate,
                                        status: InstrumentMarketDataJobStatusEnum.UNSUPPORTED
                                    }))
                            )
                        ],
                        { discard: true }
                    );

                    if (isRepairNeeded) {
                        yield* Db.transaction(writeData);
                        yield* marketPricedRevaluationService.repairAfterPriceJob(job, instrument.type, isFirstPriceBatch);
                        yield* markJob;

                        return;
                    }

                    yield* Db.transaction(Effect.flatMap(markJob, isClaimOwner => (isClaimOwner ? writeData : Effect.void)));
                }),
                failJob: (job: InstrumentMarketDataJobEntityInterface, cause: Cause.Cause<unknown>) =>
                    instrumentMarketDataJobRepository.markFailed(job, cause.pipe(Cause.squash, getErrorMessage))
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
            EntryBaseValuationService.layer,
            InzhurPriceService.layer,
            MarketPricedRevaluationService.layer,
            KlinesHistoryService.layer,
            YahooMarketDataService.layer
        ])
    );
}
