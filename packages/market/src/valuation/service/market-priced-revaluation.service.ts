import {
    InstrumentRepository,
    InstrumentMarketDataJobStatusEnum,
    InstrumentTypeEnum,
    SettingsRepository,
    SyncApplyStateRepository,
    TransactionEntryBaseValuationRepository,
    YIELD_TO_UI
} from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { InstrumentDailyMarketPriceRepository } from '../../market-data/repository/instrument-daily-market-price.repository';
import { InstrumentMarketDataJobRepository } from '../../market-data/repository/instrument-market-data-job.repository';
import { CRYPTO_PRICE_CARRY_DAYS, FUND_PRICE_CARRY_DAYS } from '../constant/price-carry-days.constant';

import { EntryBaseValuationService } from './entry-base-valuation.service';

import type { EntryBaseValuationUpdateBuilderType } from '../type/entry-base-valuation-update-builder.type';
import type {
    AccountNotFoundError,
    Db,
    DbError,
    EntryBaseValuationUpdateInterface,
    InstrumentMarketDataJobEntityInterface,
    MarketPricedEntryRowInterface
} from '@budgie/contracts';

export class MarketPricedRevaluationService extends Context.Service<MarketPricedRevaluationService>()(
    '@budgie/market/MarketPricedRevaluationService',
    {
        make: Effect.gen(function* () {
            const transactionEntryBaseValuationRepository = yield* TransactionEntryBaseValuationRepository;
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const syncApplyStateRepository = yield* SyncApplyStateRepository;
            const exchangeRatesService = yield* ExchangeRatesService;
            const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const instrumentMarketDataJobRepository = yield* InstrumentMarketDataJobRepository;
            const settingsRepository = yield* SettingsRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const batchSize = 200;
            const syncIdChunkSize = 500;
            const cryptoStrictValuationVersion = 1;
            const lastDay = '9999-12-31';

            const shiftDay = (day: string, days: number): string => format(addDays(parseISO(day), days), 'yyyy-MM-dd');

            const isUnchanged = (row: MarketPricedEntryRowInterface, update: EntryBaseValuationUpdateInterface): boolean =>
                row.baseInstrumentId === update.baseInstrumentId &&
                row.baseExchangeRate === update.baseExchangeRate &&
                row.baseAmount === update.baseAmount;

            const toPricedUpdate: EntryBaseValuationUpdateBuilderType = (row, valuation) =>
                isDefined(valuation.baseInstrumentId) && isDefined(valuation.baseExchangeRate)
                    ? {
                          id: row.id,
                          baseInstrumentId: valuation.baseInstrumentId,
                          baseExchangeRate: valuation.baseExchangeRate,
                          baseAmount: valuation.baseAmount
                      }
                    : null;

            const toEstimatedUpdate: EntryBaseValuationUpdateBuilderType = row => ({
                id: row.id,
                baseInstrumentId: row.baseInstrumentId,
                baseExchangeRate: null,
                baseAmount: row.baseAmount
            });

            const makeAnyValueUpdate =
                (baseInstrumentId: number): EntryBaseValuationUpdateBuilderType =>
                (row, valuation) =>
                    isDefined(valuation.baseAmount) || !isDefined(row.baseAmount) || row.baseInstrumentId !== baseInstrumentId
                        ? { id: row.id, baseInstrumentId, baseExchangeRate: valuation.baseExchangeRate, baseAmount: valuation.baseAmount }
                        : null;

            const revalueRows = Effect.fnUntraced(function* (
                rows: readonly MarketPricedEntryRowInterface[],
                buildUpdate: EntryBaseValuationUpdateBuilderType
            ) {
                const valuations = yield* entryBaseValuationService.valueMicroUnitEntries(
                    rows.map(row => ({ accountId: row.accountId, amount: row.amount, operatedAt: row.operatedAt }))
                );
                const updates = rows.flatMap((row, index) => {
                    const valuation = valuations[index];
                    const update = isDefined(valuation) ? buildUpdate(row, valuation) : null;

                    return isDefined(update) && !isUnchanged(row, update) ? [update] : [];
                });

                if (isNotEmptyArray(updates)) {
                    yield* syncApplyStateRepository.withoutTriggers(
                        transactionEntryBaseValuationRepository.updateEntryBaseValuations(updates)
                    );
                }

                yield* YIELD_TO_UI;
            });

            const revaluePages = (
                findPage: (afterId: number) => Effect.Effect<readonly MarketPricedEntryRowInterface[], DbError, Db>,
                buildUpdate: EntryBaseValuationUpdateBuilderType,
                onPage: (entryCount: number) => Effect.Effect<void>,
                afterId: number
            ): Effect.Effect<void, DbError | AccountNotFoundError, Db> =>
                Effect.flatMap(findPage(afterId), rows => {
                    const lastRow = rows.at(-1);

                    return isDefined(lastRow)
                        ? revalueRows(rows, buildUpdate).pipe(
                              Effect.andThen(onPage(rows.length)),
                              Effect.andThen(revaluePages(findPage, buildUpdate, onPage, lastRow.id))
                          )
                        : Effect.void;
                });

            const revalueInstrumentRange = Effect.fn('MarketPricedRevaluationService.revalueInstrumentRange')(function* (
                instrumentId: number,
                fromDate: string,
                toDate: string
            ) {
                yield* revaluePages(
                    afterId =>
                        transactionEntryBaseValuationRepository.findMarketPricedEntriesInRange({
                            instrumentId,
                            fromDate,
                            toDate,
                            afterId,
                            limit: batchSize
                        }),
                    toPricedUpdate,
                    () => Effect.void,
                    0
                );
            });

            const correctInstrument = Effect.fn('MarketPricedRevaluationService.correctInstrument')(function* (instrumentId: number) {
                const earliestPriceDate = yield* instrumentDailyMarketPriceRepository.findEarliestPriceDate(instrumentId);
                const baseInstrument = yield* exchangeRatesService.getBaseInstrument();

                if (!isDefined(baseInstrument)) {
                    return;
                }

                const latestJob = yield* instrumentMarketDataJobRepository.findLatestByInstrumentAndQuote(instrumentId, baseInstrument.id);
                const instrument = yield* instrumentRepository.findById(instrumentId);
                const isUnsupported =
                    (isDefined(instrument) && (!isDefined(instrument.priceProvider) || !isDefined(instrument.providerInstrumentId))) ||
                    latestJob?.status === InstrumentMarketDataJobStatusEnum.UNSUPPORTED;

                if (!isDefined(earliestPriceDate) && !isUnsupported) {
                    return;
                }

                yield* revaluePages(
                    afterId =>
                        transactionEntryBaseValuationRepository.findMarketPricedEntriesInRange({
                            instrumentId,
                            ...(isDefined(earliestPriceDate) && { fromDate: earliestPriceDate }),
                            toDate: lastDay,
                            afterId,
                            limit: batchSize
                        }),
                    isUnsupported && !isDefined(earliestPriceDate) ? toEstimatedUpdate : makeAnyValueUpdate(baseInstrument.id),
                    () => Effect.void,
                    0
                );
            });

            return {
                revalueInstrumentRange,
                correctInstrument,
                valuePendingEntries: Effect.fn('MarketPricedRevaluationService.valuePendingEntries')(function* (
                    baseInstrumentId: number,
                    onPage: (entryCount: number) => Effect.Effect<void>
                ) {
                    yield* revaluePages(
                        afterId =>
                            transactionEntryBaseValuationRepository.findPendingMarketPricedEntries(baseInstrumentId, afterId, batchSize),
                        makeAnyValueUpdate(baseInstrumentId),
                        onPage,
                        0
                    );
                }),
                revalueTransactions: Effect.fn('MarketPricedRevaluationService.revalueTransactions')(function* (
                    transactionSyncIds: readonly string[]
                ) {
                    for (let start = 0; start < transactionSyncIds.length; start += syncIdChunkSize) {
                        const chunk = transactionSyncIds.slice(start, start + syncIdChunkSize);

                        yield* revaluePages(
                            afterId => transactionEntryBaseValuationRepository.findMarketPricedEntriesBySyncIds(chunk, afterId, batchSize),
                            toPricedUpdate,
                            () => Effect.void,
                            0
                        );
                    }
                }),
                repairAfterPriceJob: Effect.fn('MarketPricedRevaluationService.repairAfterPriceJob')(function* (
                    job: Pick<InstrumentMarketDataJobEntityInterface, 'instrumentId' | 'fromDate' | 'toDate'>,
                    instrumentType: InstrumentTypeEnum,
                    isFirstPriceBatch: boolean
                ) {
                    if (isFirstPriceBatch) {
                        return yield* correctInstrument(job.instrumentId);
                    }

                    const isFund = instrumentType === InstrumentTypeEnum.FUND;
                    const forwardDays = isFund ? FUND_PRICE_CARRY_DAYS : CRYPTO_PRICE_CARRY_DAYS;
                    const backwardDays = isFund ? FUND_PRICE_CARRY_DAYS : 0;

                    yield* revalueInstrumentRange(
                        job.instrumentId,
                        shiftDay(job.fromDate, -backwardDays),
                        shiftDay(job.toDate, forwardDays)
                    );
                }),
                runCryptoStrictValuationStep: Effect.fn('MarketPricedRevaluationService.runCryptoStrictValuationStep')(function* () {
                    const settings = yield* settingsRepository.find;

                    if (!isDefined(settings) || settings.cryptoStrictValuationVersion >= cryptoStrictValuationVersion) {
                        return;
                    }

                    const instrumentIds = yield* transactionEntryBaseValuationRepository.findMarketPricedInstrumentIds;

                    yield* Effect.forEach(instrumentIds, correctInstrument, { discard: true });
                    yield* settingsRepository.update({ cryptoStrictValuationVersion });
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(MarketPricedRevaluationService, MarketPricedRevaluationService.make).pipe(
        Layer.provide([
            TransactionEntryBaseValuationRepository.layer,
            EntryBaseValuationService.layer,
            SyncApplyStateRepository.layer,
            ExchangeRatesService.layer,
            InstrumentDailyMarketPriceRepository.layer,
            SettingsRepository.layer,
            InstrumentRepository.layer,
            InstrumentMarketDataJobRepository.layer
        ])
    );
}
