import {
    AccountNotFoundError,
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { findLastIndexOnOrBefore } from '../../@generic/utils/find-last-index-on-or-before.util';
import { resolveDirectOrInverseRate } from '../../@generic/utils/resolve-direct-or-inverse-rate.util';
import { ExchangeRateRepository } from '../../exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';

import type { EntryBaseValuationContextInterface } from '../interface/entry-base-valuation-context.interface';
import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type { RateLookupsInterface } from '../interface/rate-lookups.interface';
import type {
    AccountWithInstrumentEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

export class EntryBaseValuationService extends Context.Service<EntryBaseValuationService>()('@budgie/market/EntryBaseValuationService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const rateDateFormat = 'yyyy-MM-dd';

        const buildBaseValuation = (baseInstrumentId: number, baseExchangeRate: number, amount: number): EntryBaseValuationInterface => ({
            baseInstrumentId,
            baseExchangeRate,
            baseAmount: Math.round(amount * baseExchangeRate)
        });

        const resolveMissingBaseValuation = Effect.fnUntraced(function* (
            account: AccountWithInstrumentEntityInterface,
            targetInstrumentId: number
        ) {
            const isPriceDriven =
                account.type === AccountTypeEnum.CRYPTO ||
                account.type === AccountTypeEnum.CRYPTO_SYNC ||
                account.instrument.type === InstrumentTypeEnum.FUND;

            if (isPriceDriven) {
                const missingValuation: EntryBaseValuationInterface = {
                    baseInstrumentId: null,
                    baseExchangeRate: null,
                    baseAmount: null
                };

                return missingValuation;
            }

            return yield* Effect.die(new Error(`Exchange rate ${account.instrumentId}->${targetInstrumentId} not found`));
        });

        const queryLookups: RateLookupsInterface = {
            findForDateOrBefore: historicalExchangeRateRepository.findForDateOrBefore,
            findEarliest: historicalExchangeRateRepository.findEarliest,
            findLatest: exchangeRateRepository.findByBaseAndQuoteIds,
            findInstrumentByCode: instrumentRepository.findByCode
        };

        const makeRangeLookups = Effect.fnUntraced(function* (fromDate: string, toDate: string) {
            const capacity = Number.MAX_SAFE_INTEGER;
            const rangeRates = yield* Cache.make({
                capacity,
                lookup: ([sourceInstrumentId, targetInstrumentId]: readonly [number, number]) =>
                    Effect.map(
                        Effect.all([
                            historicalExchangeRateRepository.findForDateOrBefore(sourceInstrumentId, targetInstrumentId, fromDate),
                            historicalExchangeRateRepository.findInDateRange(sourceInstrumentId, targetInstrumentId, fromDate, toDate)
                        ]),
                        ([before, inRange]) => {
                            const rates = isDefined(before) && before.rateDate < fromDate ? [before, ...inRange] : inRange;

                            return { rates, rateDates: rates.map(rate => rate.rateDate) };
                        }
                    )
            });
            const earliest = yield* Cache.make({
                capacity,
                lookup: ([sourceInstrumentId, targetInstrumentId]: readonly [number, number]) =>
                    historicalExchangeRateRepository.findEarliest(sourceInstrumentId, targetInstrumentId)
            });
            const latest = yield* Cache.make({
                capacity,
                lookup: ([baseInstrumentId, quoteInstrumentId]: readonly [number, number]) =>
                    exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, quoteInstrumentId)
            });
            const instruments = yield* Cache.make({ capacity, lookup: (code: CurrencyEnum) => instrumentRepository.findByCode(code) });

            const lookups: RateLookupsInterface = {
                findForDateOrBefore: (sourceInstrumentId, targetInstrumentId, rateDate) =>
                    rateDate < fromDate || rateDate > toDate
                        ? historicalExchangeRateRepository.findForDateOrBefore(sourceInstrumentId, targetInstrumentId, rateDate)
                        : Effect.map(
                              Cache.get(rangeRates, [sourceInstrumentId, targetInstrumentId] as const),
                              ({ rates, rateDates }) => rates[findLastIndexOnOrBefore(rateDates, rateDate)]
                          ),
                findEarliest: (sourceInstrumentId, targetInstrumentId) =>
                    Cache.get(earliest, [sourceInstrumentId, targetInstrumentId] as const),
                findLatest: (baseInstrumentId, quoteInstrumentId) => Cache.get(latest, [baseInstrumentId, quoteInstrumentId] as const),
                findInstrumentByCode: code => Cache.get(instruments, code)
            };

            return lookups;
        });

        const resolveHistoricalEuroRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            instrumentId: number,
            euroInstrumentId: number,
            rateDate: string
        ) {
            if (instrumentId === euroInstrumentId) {
                return 1;
            }

            const exchangeRate = yield* lookups.findForDateOrBefore(instrumentId, euroInstrumentId, rateDate);

            return isDefined(exchangeRate) ? exchangeRate.rate : null;
        });

        const resolveHistoricalBridgeExchangeRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            sourceInstrumentId: number,
            targetInstrumentId: number,
            rateDate: string
        ) {
            const euroInstrument = yield* lookups.findInstrumentByCode(CurrencyEnum.EUR);

            if (!isDefined(euroInstrument)) {
                return null;
            }

            const [sourceToEuroRate, targetToEuroRate] = yield* Effect.all(
                [
                    resolveHistoricalEuroRate(lookups, sourceInstrumentId, euroInstrument.id, rateDate),
                    resolveHistoricalEuroRate(lookups, targetInstrumentId, euroInstrument.id, rateDate)
                ],
                { concurrency: 'unbounded' }
            );

            if (isDefined(sourceToEuroRate) && isDefined(targetToEuroRate)) {
                return sourceToEuroRate / targetToEuroRate;
            }

            return null;
        });

        const resolveDirectHistoricalRateOrNull = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            sourceInstrumentId: number,
            targetInstrumentId: number,
            operatedAt: Date
        ) {
            const rateDate = format(operatedAt, rateDateFormat);
            const dateRate = yield* resolveDirectOrInverseRate(
                (sourceId, targetId) => lookups.findForDateOrBefore(sourceId, targetId, rateDate),
                sourceInstrumentId,
                targetInstrumentId
            );

            if (isDefined(dateRate)) {
                return dateRate;
            }

            const oldestRate = yield* resolveDirectOrInverseRate(lookups.findEarliest, sourceInstrumentId, targetInstrumentId);

            if (isDefined(oldestRate)) {
                return oldestRate;
            }

            const bridgeExchangeRate = yield* resolveHistoricalBridgeExchangeRate(
                lookups,
                sourceInstrumentId,
                targetInstrumentId,
                rateDate
            );

            if (isDefined(bridgeExchangeRate)) {
                return bridgeExchangeRate;
            }

            return yield* resolveDirectOrInverseRate(lookups.findLatest, sourceInstrumentId, targetInstrumentId);
        });

        const resolveBaseExchangeRateOrNull = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            sourceInstrumentId: number,
            targetInstrumentId: number,
            operatedAt: Date
        ) {
            const directRate = yield* resolveDirectHistoricalRateOrNull(lookups, sourceInstrumentId, targetInstrumentId, operatedAt);

            if (isDefined(directRate)) {
                return directRate;
            }

            const hryvniaInstrument = yield* lookups.findInstrumentByCode(CurrencyEnum.UAH);

            if (
                !isDefined(hryvniaInstrument) ||
                sourceInstrumentId === hryvniaInstrument.id ||
                targetInstrumentId === hryvniaInstrument.id
            ) {
                return null;
            }

            const sourceToHryvniaRate = yield* resolveDirectHistoricalRateOrNull(
                lookups,
                sourceInstrumentId,
                hryvniaInstrument.id,
                operatedAt
            );
            const hryvniaToTargetRate = yield* resolveDirectHistoricalRateOrNull(
                lookups,
                hryvniaInstrument.id,
                targetInstrumentId,
                operatedAt
            );

            return isDefined(sourceToHryvniaRate) && isDefined(hryvniaToTargetRate) ? sourceToHryvniaRate * hryvniaToTargetRate : null;
        });

        const createContext = Effect.fn('EntryBaseValuationService.createContext')(function* (operatedAts: readonly Date[]) {
            const rateDates = operatedAts.map(operatedAt => format(operatedAt, rateDateFormat)).sort();
            const lookups = yield* makeRangeLookups(rateDates.at(0) ?? '', rateDates.at(-1) ?? '');
            const context: EntryBaseValuationContextInterface = {
                baseInstrument: yield* exchangeRatesService.getBaseInstrument(),
                accounts: yield* Cache.make({
                    capacity: Number.MAX_SAFE_INTEGER,
                    lookup: (accountId: number) => accountRepository.findByIdIncludingArchived(accountId)
                }),
                rates: yield* Cache.make({
                    capacity: Number.MAX_SAFE_INTEGER,
                    lookup: ([sourceInstrumentId, targetInstrumentId, rateDayStart]: readonly [number, number, number]) =>
                        resolveBaseExchangeRateOrNull(lookups, sourceInstrumentId, targetInstrumentId, new Date(rateDayStart))
                })
            };

            return context;
        });

        const valueAccountAmount = Effect.fnUntraced(function* (
            { accountId, amount, operatedAt }: EntryBaseValuationInputInterface,
            context: EntryBaseValuationContextInterface
        ) {
            const { baseInstrument } = context;
            const account = yield* Cache.get(context.accounts, accountId);

            if (!isDefined(account)) {
                return yield* AccountNotFoundError.make({ id: accountId });
            }

            if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
                return yield* Effect.die(new Error('Base instrument not found'));
            }

            if (account.instrumentId === baseInstrument.id) {
                return buildBaseValuation(baseInstrument.id, 1, amount);
            }

            const baseExchangeRate = yield* Cache.get(context.rates, [
                account.instrumentId,
                baseInstrument.id,
                startOfDay(operatedAt).getTime()
            ]);

            if (!isDefined(baseExchangeRate)) {
                return yield* resolveMissingBaseValuation(account, baseInstrument.id);
            }

            return buildBaseValuation(baseInstrument.id, baseExchangeRate, amount);
        });

        const resolveEntryValuation = Effect.fnUntraced(function* (
            entry: TransactionEntryCreateInputInterface,
            operatedAt: Date,
            context: EntryBaseValuationContextInterface
        ) {
            if (
                isDefined(context.baseInstrument) &&
                entry.baseInstrumentId === context.baseInstrument.id &&
                isDefined(entry.baseExchangeRate) &&
                isDefined(entry.baseAmount)
            ) {
                const providedValuation: EntryBaseValuationInterface = {
                    baseInstrumentId: entry.baseInstrumentId,
                    baseExchangeRate: entry.baseExchangeRate,
                    baseAmount: entry.baseAmount
                };

                return providedValuation;
            }

            return yield* valueAccountAmount(
                { accountId: entry.accountId, amount: convertToMicroUnits(entry.amount), operatedAt },
                context
            );
        });

        const valueEntriesInContext = Effect.fn('EntryBaseValuationService.valueEntriesInContext')(function* (
            entries: TransactionEntryCreateInputInterface[],
            operatedAt: Date,
            context: EntryBaseValuationContextInterface
        ) {
            const entryValuations = yield* Effect.forEach(
                entries,
                entry => resolveEntryValuation(entry, operatedAt, context).pipe(Effect.map(valuation => [entry, valuation] as const)),
                { concurrency: 'unbounded' }
            );

            return new Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>(entryValuations);
        });

        return {
            resolveHistoricalBaseExchangeRateOrNull: Effect.fn('EntryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull')(
                (sourceInstrumentId: number, targetInstrumentId: number, operatedAt: Date) =>
                    resolveBaseExchangeRateOrNull(queryLookups, sourceInstrumentId, targetInstrumentId, operatedAt)
            ),
            valueMicroUnitEntry: Effect.fn('EntryBaseValuationService.valueMicroUnitEntry')(function* (
                input: EntryBaseValuationInputInterface
            ) {
                const valuationContext = yield* createContext([input.operatedAt]);

                return yield* valueAccountAmount(input, valuationContext);
            }),
            valueEntries: Effect.fn('EntryBaseValuationService.valueEntries')(function* (
                entries: TransactionEntryCreateInputInterface[],
                operatedAt: Date
            ) {
                const valuationContext = yield* createContext([operatedAt]);

                return yield* valueEntriesInContext(entries, operatedAt, valuationContext);
            }),
            valueTransactionsEntries: Effect.fn('EntryBaseValuationService.valueTransactionsEntries')(function* (
                transactions: readonly Pick<TransactionCreateInputInterface, 'entries' | 'operatedAt'>[]
            ) {
                const context = yield* createContext(transactions.map(transaction => transaction.operatedAt));

                return yield* Effect.forEach(
                    transactions,
                    transaction => valueEntriesInContext(transaction.entries, transaction.operatedAt, context),
                    { concurrency: 'unbounded' }
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(EntryBaseValuationService, EntryBaseValuationService.make).pipe(
        Layer.provide([
            AccountRepository.layer,
            HistoricalExchangeRateRepository.layer,
            InstrumentRepository.layer,
            ExchangeRateRepository.layer,
            ExchangeRatesService.layer
        ])
    );
}
