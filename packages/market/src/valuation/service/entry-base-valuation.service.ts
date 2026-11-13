import {
    AccountNotFoundError,
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    convertToMicroUnits
} from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { USDT_INSTRUMENT_CODE } from '../../@generic/constant/usdt-instrument-code.constant';
import { findLastIndexOnOrBefore } from '../../@generic/utils/find-last-index-on-or-before.util';
import { formatUtcDay } from '../../@generic/utils/format-utc-day.util';
import { resolveDirectOrInverseRate } from '../../@generic/utils/resolve-direct-or-inverse-rate.util';
import { ExchangeRateRepository } from '../../exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../../market-data/repository/instrument-daily-market-price.repository';
import { InzhurPriceService } from '../../market-data/service/inzhur-price.service';
import { CRYPTO_PRICE_CARRY_DAYS, FUND_PRICE_CARRY_DAYS } from '../constant/price-carry-days.constant';

import type { EntryBaseValuationContextInterface } from '../interface/entry-base-valuation-context.interface';
import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type { RateLookupsInterface } from '../interface/rate-lookups.interface';
import type { ResolvedBaseRateInterface } from '../interface/resolved-base-rate.interface';
import type {
    AccountWithInstrumentEntityInterface,
    DbError,
    InstrumentEntityInterface,
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
        const inzhurPriceService = yield* InzhurPriceService;
        const stablecoinCodes: ReadonlySet<string> = new Set(['USDT', 'USDC', 'FDUSD']);

        const confirmed = (rate: number): ResolvedBaseRateInterface => ({ rate, isConfirmed: true });
        const estimated = (rate: number | null): ResolvedBaseRateInterface | null => (isDefined(rate) ? { rate, isConfirmed: false } : null);

        const buildBaseValuation = (
            baseInstrumentId: number,
            resolved: ResolvedBaseRateInterface,
            amount: number
        ): EntryBaseValuationInterface => ({
            baseInstrumentId,
            baseExchangeRate: resolved.isConfirmed ? resolved.rate : null,
            baseAmount: Math.round(amount * resolved.rate)
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

        const memoize = <Key, Value, Requirements>(lookup: (key: Key) => Effect.Effect<Value, DbError, Requirements>) =>
            Cache.make({ capacity: Number.MAX_SAFE_INTEGER, lookup });

        const makeRangeLookups = Effect.fnUntraced(function* (fromDate: string, toDate: string) {
            const rangeRates = yield* memoize(([sourceInstrumentId, targetInstrumentId]: readonly [number, number]) =>
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
            );
            const earliest = yield* memoize(([sourceInstrumentId, targetInstrumentId]: readonly [number, number]) =>
                historicalExchangeRateRepository.findEarliest(sourceInstrumentId, targetInstrumentId)
            );
            const latest = yield* memoize(([baseInstrumentId, quoteInstrumentId]: readonly [number, number]) =>
                exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, quoteInstrumentId)
            );
            const instruments = yield* memoize((code: string) => instrumentRepository.findByCode(code));

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
            rateDate: string
        ) {
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
            rateDate: string
        ) {
            const directRate = yield* resolveDirectHistoricalRateOrNull(lookups, sourceInstrumentId, targetInstrumentId, rateDate);

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
                rateDate
            );
            const hryvniaToTargetRate = yield* resolveDirectHistoricalRateOrNull(
                lookups,
                hryvniaInstrument.id,
                targetInstrumentId,
                rateDate
            );

            return isDefined(sourceToHryvniaRate) && isDefined(hryvniaToTargetRate) ? sourceToHryvniaRate * hryvniaToTargetRate : null;
        });

        const resolveQuoteToBaseRate = (lookups: RateLookupsInterface, quoteInstrumentId: number, baseInstrumentId: number, rateDate: string) =>
            quoteInstrumentId === baseInstrumentId
                ? Effect.succeed(1)
                : resolveBaseExchangeRateOrNull(lookups, quoteInstrumentId, baseInstrumentId, rateDate);

        const resolveCarriedPrice = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            sourceInstrumentId: number,
            targetInstrumentId: number,
            rateDate: string
        ) {
            const price = yield* lookups.findForDateOrBefore(sourceInstrumentId, targetInstrumentId, rateDate);

            return isDefined(price) && differenceInCalendarDays(rateDate, price.rateDate) <= CRYPTO_PRICE_CARRY_DAYS ? price.rate : null;
        });

        const resolveUsdtBridgedRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            instrumentId: number,
            baseInstrumentId: number,
            rateDate: string
        ) {
            const tether = yield* lookups.findInstrumentByCode(USDT_INSTRUMENT_CODE);

            if (!isDefined(tether) || tether.id === instrumentId) {
                return null;
            }

            const instrumentToTether = yield* resolveCarriedPrice(lookups, instrumentId, tether.id, rateDate);
            const tetherToBase = isDefined(instrumentToTether)
                ? yield* resolveQuoteToBaseRate(lookups, tether.id, baseInstrumentId, rateDate)
                : null;

            return isDefined(instrumentToTether) && isDefined(tetherToBase) ? instrumentToTether * tetherToBase : null;
        });

        const resolveCryptoRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>,
            baseInstrumentId: number,
            rateDate: string
        ) {
            const directRate = yield* resolveCarriedPrice(lookups, instrument.id, baseInstrumentId, rateDate);
            const pricedRate = directRate ?? (yield* resolveUsdtBridgedRate(lookups, instrument.id, baseInstrumentId, rateDate));

            if (isDefined(pricedRate)) {
                return confirmed(pricedRate);
            }

            if (stablecoinCodes.has(instrument.code)) {
                const dollar = yield* lookups.findInstrumentByCode(CurrencyEnum.USD);

                return estimated(isDefined(dollar) ? yield* resolveQuoteToBaseRate(lookups, dollar.id, baseInstrumentId, rateDate) : null);
            }

            return estimated(yield* resolveBaseExchangeRateOrNull(lookups, instrument.id, baseInstrumentId, rateDate));
        });

        const resolveFundRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            instrumentId: number,
            baseInstrumentId: number,
            rateDate: string
        ) {
            const nav = yield* inzhurPriceService.findNearestPricePoint(instrumentId, rateDate);
            const hryvnia = yield* lookups.findInstrumentByCode(CurrencyEnum.UAH);
            const hryvniaToBase =
                isDefined(nav) && nav.distanceInDays <= FUND_PRICE_CARRY_DAYS && isDefined(hryvnia)
                    ? yield* resolveQuoteToBaseRate(lookups, hryvnia.id, baseInstrumentId, rateDate)
                    : null;

            if (isDefined(nav) && isDefined(hryvniaToBase)) {
                return confirmed(nav.price * hryvniaToBase);
            }

            return estimated(yield* resolveBaseExchangeRateOrNull(lookups, instrumentId, baseInstrumentId, rateDate));
        });

        const resolveAccountRate = Effect.fnUntraced(function* (
            lookups: RateLookupsInterface,
            account: AccountWithInstrumentEntityInterface,
            baseInstrumentId: number,
            rateDate: string
        ) {
            if (account.instrumentId === baseInstrumentId) {
                return confirmed(1);
            }

            if (account.instrument.type === InstrumentTypeEnum.FUND) {
                return yield* resolveFundRate(lookups, account.instrumentId, baseInstrumentId, rateDate);
            }

            if (account.type === AccountTypeEnum.CRYPTO || account.type === AccountTypeEnum.CRYPTO_SYNC) {
                return yield* resolveCryptoRate(lookups, account.instrument, baseInstrumentId, rateDate);
            }

            const fiatRate = yield* resolveBaseExchangeRateOrNull(lookups, account.instrumentId, baseInstrumentId, rateDate);

            return isDefined(fiatRate) ? confirmed(fiatRate) : null;
        });

        const createContext = Effect.fn('EntryBaseValuationService.createContext')(function* (operatedAts: readonly Date[]) {
            const rateDates = operatedAts.map(formatUtcDay).sort();
            const lookups = yield* makeRangeLookups(rateDates.at(0) ?? '', rateDates.at(-1) ?? '');
            const baseInstrument = yield* exchangeRatesService.getBaseInstrument();
            const accounts = yield* memoize((accountId: number) => accountRepository.findByIdIncludingArchived(accountId));
            const context: EntryBaseValuationContextInterface = {
                baseInstrument,
                accounts,
                rates: yield* memoize(([accountId, rateDate]: readonly [number, string]) =>
                    Effect.flatMap(Cache.get(accounts, accountId), account =>
                        isDefined(account) && isDefined(baseInstrument)
                            ? resolveAccountRate(lookups, account, baseInstrument.id, rateDate)
                            : Effect.succeed(null)
                    )
                )
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

            const resolvedRate = yield* Cache.get(context.rates, [account.id, formatUtcDay(operatedAt)]);

            if (!isDefined(resolvedRate)) {
                return yield* resolveMissingBaseValuation(account, baseInstrument.id);
            }

            return buildBaseValuation(baseInstrument.id, resolvedRate, amount);
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
                    resolveBaseExchangeRateOrNull(queryLookups, sourceInstrumentId, targetInstrumentId, formatUtcDay(operatedAt))
            ),
            resolveHistoricalBaseExchangeRateForDay: (sourceInstrumentId: number, targetInstrumentId: number, rateDate: string) =>
                resolveBaseExchangeRateOrNull(queryLookups, sourceInstrumentId, targetInstrumentId, rateDate),
            valueMicroUnitEntry: Effect.fn('EntryBaseValuationService.valueMicroUnitEntry')(function* (
                input: EntryBaseValuationInputInterface
            ) {
                const valuationContext = yield* createContext([input.operatedAt]);

                return yield* valueAccountAmount(input, valuationContext);
            }),
            valueMicroUnitEntries: Effect.fn('EntryBaseValuationService.valueMicroUnitEntries')(function* (
                inputs: readonly EntryBaseValuationInputInterface[]
            ) {
                const valuationContext = yield* createContext(inputs.map(input => input.operatedAt));

                return yield* Effect.forEach(inputs, input => valueAccountAmount(input, valuationContext));
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
            ExchangeRatesService.layer,
            InzhurPriceService.layer,
            InstrumentDailyMarketPriceRepository.layer
        ])
    );
}
