import { AccountNotFoundError, AccountRepository, AccountTypeEnum, CurrencyEnum, InstrumentRepository, PRECISION } from '@budgie/contracts';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';

import type { EntryBaseValuationContextInterface } from '../interface/entry-base-valuation-context.interface';
import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type {
    Db,
    DbError,
    HistoricalExchangeRateEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

export class EntryBaseValuationService extends Context.Service<EntryBaseValuationService>()('@budgie/market/EntryBaseValuationService', {
    make: Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const exchangeRatesService = yield* ExchangeRatesService;
        const rateDateFormat = 'yyyy-MM-dd';

        const buildBaseValuation = (baseInstrumentId: number, baseExchangeRate: number, amount: number): EntryBaseValuationInterface => ({
            baseInstrumentId,
            baseExchangeRate,
            baseAmount: Math.round(amount * baseExchangeRate)
        });

        const resolveMissingBaseValuation = Effect.fnUntraced(function* (
            accountType: AccountTypeEnum,
            sourceInstrumentId: number,
            targetInstrumentId: number
        ) {
            if (accountType === AccountTypeEnum.CRYPTO || accountType === AccountTypeEnum.CRYPTO_SYNC) {
                const missingValuation: EntryBaseValuationInterface = {
                    baseInstrumentId: null,
                    baseExchangeRate: null,
                    baseAmount: null
                };

                return missingValuation;
            }

            return yield* Effect.die(new Error(`Exchange rate ${sourceInstrumentId}->${targetInstrumentId} not found`));
        });

        const resolveDirectOrInverseRate = Effect.fnUntraced(function* (
            lookup: (
                sourceInstrumentId: number,
                targetInstrumentId: number
            ) => Effect.Effect<HistoricalExchangeRateEntityInterface | undefined, DbError, Db>,
            sourceInstrumentId: number,
            targetInstrumentId: number
        ) {
            const direct = yield* lookup(sourceInstrumentId, targetInstrumentId);

            if (isDefined(direct)) {
                return direct.rate;
            }

            const inverse = yield* lookup(targetInstrumentId, sourceInstrumentId);

            if (isDefined(inverse)) {
                return 1 / inverse.rate;
            }

            return null;
        });

        const resolveHistoricalEuroRate = Effect.fnUntraced(function* (instrumentId: number, euroInstrumentId: number, rateDate: string) {
            if (instrumentId === euroInstrumentId) {
                return 1;
            }

            const exchangeRate = yield* historicalExchangeRateRepository.findForDateOrBefore(instrumentId, euroInstrumentId, rateDate);

            return isDefined(exchangeRate) ? exchangeRate.rate : null;
        });

        const resolveHistoricalBridgeExchangeRate = Effect.fnUntraced(function* (
            sourceInstrumentId: number,
            targetInstrumentId: number,
            rateDate: string
        ) {
            const euroInstrument = yield* instrumentRepository.findByCode(CurrencyEnum.EUR);

            if (!isDefined(euroInstrument)) {
                return null;
            }

            const [sourceToEuroRate, targetToEuroRate] = yield* Effect.all(
                [
                    resolveHistoricalEuroRate(sourceInstrumentId, euroInstrument.id, rateDate),
                    resolveHistoricalEuroRate(targetInstrumentId, euroInstrument.id, rateDate)
                ],
                { concurrency: 'unbounded' }
            );

            if (isDefined(sourceToEuroRate) && isDefined(targetToEuroRate)) {
                return sourceToEuroRate / targetToEuroRate;
            }

            return null;
        });

        const resolveHistoricalBaseExchangeRateOrNull = Effect.fn('EntryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull')(
            function* (sourceInstrumentId: number, targetInstrumentId: number, operatedAt: Date) {
                const rateDate = format(operatedAt, rateDateFormat);
                const dateRate = yield* resolveDirectOrInverseRate(
                    (sourceId, targetId) => historicalExchangeRateRepository.findForDateOrBefore(sourceId, targetId, rateDate),
                    sourceInstrumentId,
                    targetInstrumentId
                );

                if (isDefined(dateRate)) {
                    return dateRate;
                }

                const oldestRate = yield* resolveDirectOrInverseRate(
                    (sourceId, targetId) => historicalExchangeRateRepository.findEarliest(sourceId, targetId),
                    sourceInstrumentId,
                    targetInstrumentId
                );

                if (isDefined(oldestRate)) {
                    return oldestRate;
                }

                const bridgeExchangeRate = yield* resolveHistoricalBridgeExchangeRate(sourceInstrumentId, targetInstrumentId, rateDate);

                if (isDefined(bridgeExchangeRate)) {
                    return bridgeExchangeRate;
                }

                return yield* exchangeRatesService.findDirectOrInverseConversionRate(sourceInstrumentId, targetInstrumentId);
            }
        );

        const createContext = Effect.fn('EntryBaseValuationService.createContext')(function* () {
            const context: EntryBaseValuationContextInterface = {
                baseInstrument: yield* exchangeRatesService.getBaseInstrument(),
                accounts: yield* Cache.make({
                    capacity: Number.MAX_SAFE_INTEGER,
                    lookup: (accountId: number) => accountRepository.findByIdIncludingArchived(accountId)
                }),
                rates: yield* Cache.make({
                    capacity: Number.MAX_SAFE_INTEGER,
                    lookup: ([sourceInstrumentId, targetInstrumentId, rateDayStart]: readonly [number, number, number]) =>
                        resolveHistoricalBaseExchangeRateOrNull(sourceInstrumentId, targetInstrumentId, new Date(rateDayStart))
                })
            };

            return context;
        });

        const valueAccountAmount = Effect.fnUntraced(function* (
            { accountId, amount, operatedAt }: Pick<EntryBaseValuationInputInterface, 'accountId' | 'amount' | 'operatedAt'>,
            context: EntryBaseValuationContextInterface
        ) {
            const { baseInstrument } = context;
            const account = yield* Cache.get(context.accounts, accountId);

            if (!isDefined(account)) {
                return yield* new AccountNotFoundError({ id: accountId });
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
                return yield* resolveMissingBaseValuation(account.type, account.instrumentId, baseInstrument.id);
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
                { accountId: entry.accountId, amount: Math.round(entry.amount * PRECISION), operatedAt },
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
            resolveHistoricalBaseExchangeRateOrNull,
            valueMicroUnitEntry: Effect.fn('EntryBaseValuationService.valueMicroUnitEntry')(function* ({
                accountId,
                amount,
                operatedAt
            }: EntryBaseValuationInputInterface) {
                return yield* valueAccountAmount({ accountId, amount, operatedAt }, yield* createContext());
            }),
            valueEntries: Effect.fn('EntryBaseValuationService.valueEntries')(function* (
                entries: TransactionEntryCreateInputInterface[],
                operatedAt: Date
            ) {
                return yield* valueEntriesInContext(entries, operatedAt, yield* createContext());
            }),
            valueTransactionsEntries: Effect.fn('EntryBaseValuationService.valueTransactionsEntries')(function* (
                transactions: readonly Pick<TransactionCreateInputInterface, 'entries' | 'operatedAt'>[]
            ) {
                const context = yield* createContext();

                return yield* Effect.all(
                    transactions.map(transaction => valueEntriesInContext(transaction.entries, transaction.operatedAt, context)),
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
            ExchangeRatesService.layer
        ])
    );
}
