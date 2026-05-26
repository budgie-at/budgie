import { CurrencyEnum, ExternalSourceEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { format } from 'date-fns';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import {
    accountRepository,
    exchangeRateRepository,
    historicalExchangeRateRepository,
    instrumentRepository
} from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { exchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';

import type { EntryBaseValuationInputInterface } from '../interface/entry-base-valuation-input.interface';
import type { EntryBaseValuationInterface } from '../interface/entry-base-valuation.interface';
import type { DB, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

class EntryBaseValuationService {
    private static readonly RATE_DATE_FORMAT = 'yyyy-MM-dd';

    async valueTransactionInput(
        input: TransactionCreateInputInterface,
        tx?: DB
    ): Promise<Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>> {
        return await this.valueEntries(input.entries, input.operatedAt, input.externalSource, tx);
    }

    async valueEntries(
        entries: TransactionEntryCreateInputInterface[],
        operatedAt: Date,
        externalSource: ExternalSourceEnum | null,
        tx?: DB
    ): Promise<Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>> {
        const valuations = new Map<TransactionEntryCreateInputInterface, EntryBaseValuationInterface>();

        await Promise.all(
            entries.map(async entry => {
                valuations.set(entry, await this.resolveEntryValuation(entry, operatedAt, externalSource, tx));
            })
        );

        return valuations;
    }

    async valueMicroUnitEntry(input: EntryBaseValuationInputInterface): Promise<EntryBaseValuationInterface> {
        return await this.valueEntry(input);
    }

    async resolveHistoricalBaseExchangeRate(
        sourceInstrumentId: number,
        targetInstrumentId: number,
        operatedAt: Date,
        tx?: DB
    ): Promise<number> {
        const rateDate = format(operatedAt, EntryBaseValuationService.RATE_DATE_FORMAT);
        const exchangeRate = await historicalExchangeRateRepository.findForDateOrBefore(
            sourceInstrumentId,
            targetInstrumentId,
            rateDate,
            tx
        );

        if (isDefined(exchangeRate)) {
            return exchangeRate.rate;
        }

        const inverseExchangeRate = await historicalExchangeRateRepository.findForDateOrBefore(
            targetInstrumentId,
            sourceInstrumentId,
            rateDate,
            tx
        );

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        const bridgeExchangeRate = await this.resolveHistoricalBridgeExchangeRate(sourceInstrumentId, targetInstrumentId, rateDate, tx);

        if (isDefined(bridgeExchangeRate)) {
            return bridgeExchangeRate;
        }

        return await this.resolveCurrentBaseExchangeRate(sourceInstrumentId, targetInstrumentId);
    }

    async resolveCurrentBaseExchangeRate(sourceInstrumentId: number, targetInstrumentId: number): Promise<number> {
        const directExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(sourceInstrumentId, targetInstrumentId);

        if (isDefined(directExchangeRate)) {
            return directExchangeRate.rate;
        }

        const inverseExchangeRate = await exchangeRateRepository.findByBaseAndQuoteIds(targetInstrumentId, sourceInstrumentId);

        if (isDefined(inverseExchangeRate)) {
            return 1 / inverseExchangeRate.rate;
        }

        throw new Error(t`Exchange rate ${sourceInstrumentId}->${targetInstrumentId} not found`);
    }

    private async resolveEntryValuation(
        entry: TransactionEntryCreateInputInterface,
        operatedAt: Date,
        externalSource: ExternalSourceEnum | null,
        tx?: DB
    ): Promise<EntryBaseValuationInterface> {
        const baseInstrument = await exchangeRatesService.getBaseInstrument();

        if (
            isDefined(baseInstrument) &&
            entry.baseInstrumentId === baseInstrument.id &&
            isDefined(entry.baseExchangeRate) &&
            isDefined(entry.baseAmount)
        ) {
            return {
                baseInstrumentId: entry.baseInstrumentId,
                baseExchangeRate: entry.baseExchangeRate,
                baseAmount: entry.baseAmount
            };
        }

        return await this.valueEntry({
            accountId: entry.accountId,
            amount: convertToMicroUnits(entry.amount),
            operatedAt,
            externalSource,
            tx
        });
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

    private async valueEntry({
        accountId,
        amount,
        operatedAt,
        externalSource,
        tx
    }: EntryBaseValuationInputInterface): Promise<EntryBaseValuationInterface> {
        const [account, baseInstrument] = await Promise.all([
            accountRepository.findById(accountId, tx),
            exchangeRatesService.getBaseInstrument()
        ]);

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

        const baseExchangeRate = isDefined(externalSource)
            ? await this.resolveHistoricalBaseExchangeRate(account.instrumentId, baseInstrument.id, operatedAt, tx)
            : await this.resolveCurrentBaseExchangeRate(account.instrumentId, baseInstrument.id);

        return {
            baseInstrumentId: baseInstrument.id,
            baseExchangeRate,
            baseAmount: Math.round(amount * baseExchangeRate)
        };
    }
}

export const entryBaseValuationService = new EntryBaseValuationService();
