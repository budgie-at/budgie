import { AccountTypeEnum, CurrencyEnum, Db } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import * as Cache from 'effect/Cache';
import * as Effect from 'effect/Effect';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    exchangeRateRepository,
    historicalExchangeRateRepository,
    instrumentRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { AccountNotFoundError } from '../../account/error/account-not-found.error';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import type { EntryBaseValuationContextInterface } from '../interface/entry-base-valuation-context.interface';
import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type { EntryBaseValuationRateKeyType } from '../type/entry-base-valuation-rate-key.type';
import type {
    DbError,
    HistoricalExchangeRateEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

class EntryBaseValuationService {
    private static readonly RATE_DATE_FORMAT = 'yyyy-MM-dd';

    readonly valueMicroUnitEntry = Effect.fn('EntryBaseValuationService.valueMicroUnitEntry')(function* (
        this: EntryBaseValuationService,
        { accountId, amount, operatedAt }: EntryBaseValuationInputInterface
    ) {
        return yield* this.valueAccountAmount({ accountId, amount, operatedAt }, yield* this.createContext());
    });

    readonly resolveHistoricalBaseExchangeRateOrNull = Effect.fn('EntryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull')(
        function* (this: EntryBaseValuationService, sourceInstrumentId: number, targetInstrumentId: number, operatedAt: Date) {
            const rateDate = format(operatedAt, EntryBaseValuationService.RATE_DATE_FORMAT);
            const dateRate = yield* this.resolveDirectOrInverseRate(
                (sourceId, targetId) => historicalExchangeRateRepository.findForDateOrBefore(sourceId, targetId, rateDate),
                sourceInstrumentId,
                targetInstrumentId
            );

            if (isDefined(dateRate)) {
                return dateRate;
            }

            const oldestRate = yield* this.resolveDirectOrInverseRate(
                (sourceId, targetId) => historicalExchangeRateRepository.findEarliest(sourceId, targetId),
                sourceInstrumentId,
                targetInstrumentId
            );

            if (isDefined(oldestRate)) {
                return oldestRate;
            }

            const bridgeExchangeRate = yield* this.resolveHistoricalBridgeExchangeRate(sourceInstrumentId, targetInstrumentId, rateDate);

            if (isDefined(bridgeExchangeRate)) {
                return bridgeExchangeRate;
            }

            return yield* this.resolveCurrentBaseExchangeRate(sourceInstrumentId, targetInstrumentId);
        }
    );

    readonly valueEntries = Effect.fn('EntryBaseValuationService.valueEntries')(function* (
        this: EntryBaseValuationService,
        entries: TransactionEntryCreateInputInterface[],
        operatedAt: Date
    ) {
        return yield* this.valueEntriesInContext(entries, operatedAt, yield* this.createContext());
    });

    readonly valueTransactionsEntries = Effect.fn('EntryBaseValuationService.valueTransactionsEntries')(function* (
        this: EntryBaseValuationService,
        transactions: readonly Pick<TransactionCreateInputInterface, 'entries' | 'operatedAt'>[]
    ) {
        const context = yield* this.createContext();

        return yield* Effect.all(
            transactions.map(transaction => this.valueEntriesInContext(transaction.entries, transaction.operatedAt, context)),
            { concurrency: 'unbounded' }
        );
    });

    private readonly createContext = Effect.fn('EntryBaseValuationService.createContext')(function* (this: EntryBaseValuationService) {
        const context: EntryBaseValuationContextInterface = {
            baseInstrument: yield* exchangeRatesService.getBaseInstrument(),
            accounts: yield* Cache.make({
                capacity: Number.MAX_SAFE_INTEGER,
                lookup: (accountId: number) => accountRepository.findByIdIncludingArchived(accountId)
            }),
            rates: yield* Cache.make({
                capacity: Number.MAX_SAFE_INTEGER,
                lookup: ([sourceInstrumentId, targetInstrumentId, rateDayStart]: EntryBaseValuationRateKeyType) =>
                    this.resolveHistoricalBaseExchangeRateOrNull(sourceInstrumentId, targetInstrumentId, new Date(rateDayStart))
            })
        };

        return context;
    });

    private readonly valueEntriesInContext = Effect.fn('EntryBaseValuationService.valueEntriesInContext')(function* (
        this: EntryBaseValuationService,
        entries: TransactionEntryCreateInputInterface[],
        operatedAt: Date,
        context: EntryBaseValuationContextInterface
    ) {
        const entryValuations = yield* Effect.forEach(
            entries,
            entry => this.resolveEntryValuation(entry, operatedAt, context).pipe(Effect.map(valuation => [entry, valuation] as const)),
            { concurrency: 'unbounded' }
        );

        return new Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>(entryValuations);
    });

    private readonly valueAccountAmount = Effect.fnUntraced(function* (
        this: EntryBaseValuationService,
        { accountId, amount, operatedAt }: Pick<EntryBaseValuationInputInterface, 'accountId' | 'amount' | 'operatedAt'>,
        context: EntryBaseValuationContextInterface
    ) {
        const { baseInstrument } = context;
        const account = yield* Cache.get(context.accounts, accountId);

        if (!isDefined(account)) {
            return yield* new AccountNotFoundError({ id: accountId });
        }

        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            return yield* Effect.die(new Error(t`Base instrument not found`));
        }

        if (account.instrumentId === baseInstrument.id) {
            return this.buildBaseValuation(baseInstrument.id, 1, amount);
        }

        const baseExchangeRate = yield* Cache.get(context.rates, [
            account.instrumentId,
            baseInstrument.id,
            startOfDay(operatedAt).getTime()
        ]);

        if (!isDefined(baseExchangeRate)) {
            return yield* this.resolveMissingBaseValuation(account.type, account.instrumentId, baseInstrument.id);
        }

        return this.buildBaseValuation(baseInstrument.id, baseExchangeRate, amount);
    });

    private readonly resolveMissingBaseValuation = Effect.fnUntraced(function* (
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

        return yield* Effect.die(new Error(t`Exchange rate ${sourceInstrumentId}->${targetInstrumentId} not found`));
    });

    private readonly resolveDirectOrInverseRate = Effect.fnUntraced(function* (
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

    private readonly resolveCurrentBaseExchangeRate = Effect.fnUntraced(function* (sourceInstrumentId: number, targetInstrumentId: number) {
        const directExchangeRate = yield* Db.query(() =>
            exchangeRateRepository.findByBaseAndQuoteIds(sourceInstrumentId, targetInstrumentId)
        );

        if (isDefined(directExchangeRate)) {
            return directExchangeRate.rate;
        }

        const inverseExchangeRate = yield* Db.query(() =>
            exchangeRateRepository.findByBaseAndQuoteIds(targetInstrumentId, sourceInstrumentId)
        );

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        return null;
    });

    private readonly resolveEntryValuation = Effect.fnUntraced(function* (
        this: EntryBaseValuationService,
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

        return yield* this.valueAccountAmount(
            { accountId: entry.accountId, amount: convertToMicroUnits(entry.amount), operatedAt },
            context
        );
    });

    private readonly resolveHistoricalEuroRate = Effect.fnUntraced(function* (
        instrumentId: number,
        euroInstrumentId: number,
        rateDate: string
    ) {
        if (instrumentId === euroInstrumentId) {
            return 1;
        }

        const exchangeRate = yield* historicalExchangeRateRepository.findForDateOrBefore(instrumentId, euroInstrumentId, rateDate);

        return isDefined(exchangeRate) ? exchangeRate.rate : null;
    });

    private readonly resolveHistoricalBridgeExchangeRate = Effect.fnUntraced(function* (
        this: EntryBaseValuationService,
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
                this.resolveHistoricalEuroRate(sourceInstrumentId, euroInstrument.id, rateDate),
                this.resolveHistoricalEuroRate(targetInstrumentId, euroInstrument.id, rateDate)
            ],
            { concurrency: 'unbounded' }
        );

        if (isDefined(sourceToEuroRate) && isDefined(targetToEuroRate)) {
            return sourceToEuroRate / targetToEuroRate;
        }

        return null;
    });

    private buildBaseValuation(baseInstrumentId: number, baseExchangeRate: number, amount: number): EntryBaseValuationInterface {
        return { baseInstrumentId, baseExchangeRate, baseAmount: Math.round(amount * baseExchangeRate) };
    }
}

export const entryBaseValuationService = new EntryBaseValuationService();
