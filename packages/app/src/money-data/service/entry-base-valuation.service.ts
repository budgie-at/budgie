import { AccountTypeEnum, CurrencyEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { format } from 'date-fns/format';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    exchangeRateRepository,
    historicalExchangeRateRepository,
    instrumentRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import type { EntryBaseValuationContextInterface } from '../interface/entry-base-valuation-context.interface';
import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type {
    DB,
    HistoricalExchangeRateEntityInterface,
    TransactionCreateInputInterface,
    TransactionEntryCreateInputInterface
} from '@budgie/contracts';

class EntryBaseValuationService {
    private static readonly RATE_DATE_FORMAT = 'yyyy-MM-dd';

    @Log(
        input =>
            `enter accountId=${input.accountId} amount=${input.amount} externalSource=${input.externalSource ?? ''} hasTx=${String(isDefined(input.tx))}`,
        (result, input) =>
            `done accountId=${input.accountId} baseInstrumentId=${result.baseInstrumentId} baseExchangeRate=${result.baseExchangeRate} baseAmount=${result.baseAmount}`,
        (error, input) => `throw accountId=${input.accountId} amount=${input.amount} error=${getErrorMessage(error)}`
    )
    async valueMicroUnitEntry({
        accountId,
        amount,
        operatedAt,
        tx
    }: EntryBaseValuationInputInterface): Promise<EntryBaseValuationInterface> {
        return await this.valueAccountAmount(accountId, amount, operatedAt, await this.createContext(tx));
    }

    @Log(
        (...inputs) => {
            const [sourceInstrumentId, targetInstrumentId, operatedAt, tx] = inputs;

            return `enter sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))}`;
        },
        (result, ...inputs) => {
            const [sourceInstrumentId, targetInstrumentId, operatedAt, tx] = inputs;

            return `done sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} baseExchangeRate=${result ?? 'missing'} hasTx=${String(isDefined(tx))}`;
        },
        (error, ...inputs) => {
            const [sourceInstrumentId, targetInstrumentId, operatedAt, tx] = inputs;

            return `throw sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`;
        }
    )
    async resolveHistoricalBaseExchangeRateOrNull(
        sourceInstrumentId: number,
        targetInstrumentId: number,
        operatedAt: Date,
        tx?: DB
    ): Promise<number | null> {
        const rateDate = format(operatedAt, EntryBaseValuationService.RATE_DATE_FORMAT);
        const dateRate = await this.resolveDirectOrInverseRate(
            (sourceId, targetId) => historicalExchangeRateRepository.findForDateOrBefore(sourceId, targetId, rateDate, tx),
            sourceInstrumentId,
            targetInstrumentId
        );

        if (isDefined(dateRate)) {
            return dateRate;
        }

        const oldestRate = await this.resolveDirectOrInverseRate(
            (sourceId, targetId) => historicalExchangeRateRepository.findEarliest(sourceId, targetId, tx),
            sourceInstrumentId,
            targetInstrumentId
        );

        if (isDefined(oldestRate)) {
            return oldestRate;
        }

        const bridgeExchangeRate = await this.resolveHistoricalBridgeExchangeRate(sourceInstrumentId, targetInstrumentId, rateDate, tx);

        if (isDefined(bridgeExchangeRate)) {
            return bridgeExchangeRate;
        }

        return await this.resolveCurrentBaseExchangeRate(sourceInstrumentId, targetInstrumentId);
    }

    @Log(
        (entries, operatedAt, tx) =>
            `enter accountIds=${entries.map(entry => entry.accountId).join(',')} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))}`,
        (result, entries, operatedAt, tx) =>
            `done accountIds=${entries.map(entry => entry.accountId).join(',')} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))} count=${result.size}`,
        (error, entries, operatedAt, tx) =>
            `throw accountIds=${entries.map(entry => entry.accountId).join(',')} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async valueEntries(
        entries: TransactionEntryCreateInputInterface[],
        operatedAt: Date,
        tx?: DB
    ): Promise<Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>> {
        return await this.valueEntriesInContext(entries, operatedAt, await this.createContext(tx));
    }

    @Log(
        (transactions, tx) => `enter transactionCount=${transactions.length} hasTx=${String(isDefined(tx))}`,
        (result, transactions, tx) =>
            `done transactionCount=${transactions.length} hasTx=${String(isDefined(tx))} valuedTransactionCount=${result.length}`,
        (error, transactions, tx) =>
            `throw transactionCount=${transactions.length} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async valueTransactionsEntries(
        transactions: readonly Pick<TransactionCreateInputInterface, 'entries' | 'operatedAt'>[],
        tx: DB
    ): Promise<Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>[]> {
        const context = await this.createContext(tx);

        return await Promise.all(
            transactions.map(transaction => this.valueEntriesInContext(transaction.entries, transaction.operatedAt, context))
        );
    }

    private async createContext(tx?: DB): Promise<EntryBaseValuationContextInterface> {
        return {
            baseInstrument: await exchangeRatesService.getBaseInstrument(),
            accounts: new Map(),
            rates: new Map(),
            tx
        };
    }

    private async valueEntriesInContext(
        entries: TransactionEntryCreateInputInterface[],
        operatedAt: Date,
        context: EntryBaseValuationContextInterface
    ): Promise<Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>> {
        const valuations = new Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>();

        await Promise.all(
            entries.map(async entry => {
                valuations.set(entry, await this.resolveEntryValuation(entry, operatedAt, context));
            })
        );

        return valuations;
    }

    private async valueAccountAmount(
        accountId: number,
        amount: number,
        operatedAt: Date,
        context: EntryBaseValuationContextInterface
    ): Promise<EntryBaseValuationInterface> {
        const { baseInstrument, tx } = context;
        const account = await this.memoize(
            context.accounts,
            accountId,
            async () => await accountRepository.findByIdIncludingArchived(accountId, tx)
        );

        if (!isDefined(account)) {
            throw new Error(t`Account ${accountId} not found`);
        }

        if (!isDefined(baseInstrument) || !isPositiveNumber(baseInstrument.id)) {
            throw new Error(t`Base instrument not found`);
        }

        if (account.instrumentId === baseInstrument.id) {
            return {
                baseInstrumentId: baseInstrument.id,
                baseExchangeRate: 1,
                baseAmount: Math.round(amount)
            };
        }

        const baseExchangeRate = await this.memoize(
            context.rates,
            `${account.instrumentId}:${baseInstrument.id}:${format(operatedAt, EntryBaseValuationService.RATE_DATE_FORMAT)}`,
            () => this.resolveHistoricalBaseExchangeRateOrNull(account.instrumentId, baseInstrument.id, operatedAt, tx)
        );

        if (!isDefined(baseExchangeRate)) {
            return this.resolveMissingBaseValuation(account.type, account.instrumentId, baseInstrument.id);
        }

        return {
            baseInstrumentId: baseInstrument.id,
            baseExchangeRate,
            baseAmount: Math.round(amount * baseExchangeRate)
        };
    }

    private memoize<TKey, TValue>(cache: Map<TKey, Promise<TValue>>, key: TKey, resolve: () => Promise<TValue>): Promise<TValue> {
        const cached = cache.get(key);

        if (isDefined(cached)) {
            return cached;
        }

        const resolved = resolve();

        cache.set(key, resolved);

        return resolved;
    }

    private resolveMissingBaseValuation(
        accountType: AccountTypeEnum,
        sourceInstrumentId: number,
        targetInstrumentId: number
    ): EntryBaseValuationInterface {
        if (accountType === AccountTypeEnum.CRYPTO || accountType === AccountTypeEnum.CRYPTO_SYNC) {
            return {
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            };
        }

        throw new Error(t`Exchange rate ${sourceInstrumentId}->${targetInstrumentId} not found`);
    }

    private async resolveDirectOrInverseRate(
        lookup: (sourceInstrumentId: number, targetInstrumentId: number) => Promise<HistoricalExchangeRateEntityInterface | undefined>,
        sourceInstrumentId: number,
        targetInstrumentId: number
    ): Promise<number | null> {
        const direct = await lookup(sourceInstrumentId, targetInstrumentId);

        if (isDefined(direct)) {
            return direct.rate;
        }

        const inverse = await lookup(targetInstrumentId, sourceInstrumentId);

        if (isDefined(inverse)) {
            return 1 / inverse.rate;
        }

        return null;
    }

    private async resolveCurrentBaseExchangeRate(sourceInstrumentId: number, targetInstrumentId: number): Promise<number | null> {
        const directExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(sourceInstrumentId, targetInstrumentId);

        if (isDefined(directExchangeRate)) {
            return directExchangeRate.rate;
        }

        const inverseExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(targetInstrumentId, sourceInstrumentId);

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        return null;
    }

    private async resolveEntryValuation(
        entry: TransactionEntryCreateInputInterface,
        operatedAt: Date,
        context: EntryBaseValuationContextInterface
    ): Promise<EntryBaseValuationInterface> {
        if (
            isDefined(context.baseInstrument) &&
            entry.baseInstrumentId === context.baseInstrument.id &&
            isDefined(entry.baseExchangeRate) &&
            isDefined(entry.baseAmount)
        ) {
            return {
                baseInstrumentId: entry.baseInstrumentId,
                baseExchangeRate: entry.baseExchangeRate,
                baseAmount: entry.baseAmount
            };
        }

        return await this.valueAccountAmount(entry.accountId, convertToMicroUnits(entry.amount), operatedAt, context);
    }

    private async resolveHistoricalEuroRate(
        instrumentId: number,
        euroInstrumentId: number,
        rateDate: string,
        tx?: DB
    ): Promise<number | null> {
        if (instrumentId === euroInstrumentId) {
            return 1;
        }

        const exchangeRate = await historicalExchangeRateRepository.findForDateOrBefore(instrumentId, euroInstrumentId, rateDate, tx);

        return isDefined(exchangeRate) ? exchangeRate.rate : null;
    }

    private async resolveHistoricalBridgeExchangeRate(
        sourceInstrumentId: number,
        targetInstrumentId: number,
        rateDate: string,
        tx?: DB
    ): Promise<number | null> {
        const euroInstrument = await instrumentRepository.findByCode(CurrencyEnum.EUR);

        if (!isDefined(euroInstrument)) {
            return null;
        }

        const [sourceToEuroRate, targetToEuroRate] = await Promise.all([
            this.resolveHistoricalEuroRate(sourceInstrumentId, euroInstrument.id, rateDate, tx),
            this.resolveHistoricalEuroRate(targetInstrumentId, euroInstrument.id, rateDate, tx)
        ]);

        if (isDefined(sourceToEuroRate) && isDefined(targetToEuroRate)) {
            return sourceToEuroRate / targetToEuroRate;
        }

        return null;
    }
}

export const entryBaseValuationService = new EntryBaseValuationService();
