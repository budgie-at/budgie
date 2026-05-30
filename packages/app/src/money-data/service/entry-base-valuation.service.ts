import { CurrencyEnum, ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { format } from 'date-fns';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

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
import type { DB, TransactionEntryCreateInputInterface } from '@budgie/contracts';

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

        const baseExchangeRate = await this.resolveHistoricalBaseExchangeRate(account.instrumentId, baseInstrument.id, operatedAt, tx);

        return {
            baseInstrumentId: baseInstrument.id,
            baseExchangeRate,
            baseAmount: Math.round(amount * baseExchangeRate)
        };
    }

    @Log(
        (sourceInstrumentId, targetInstrumentId, operatedAt, tx) =>
            `enter sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))}`,
        // eslint-disable-next-line @typescript-eslint/max-params -- Log hooks intentionally keep positional arguments
        (result, sourceInstrumentId, targetInstrumentId, operatedAt, tx) =>
            `done sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} baseExchangeRate=${result} hasTx=${String(isDefined(tx))}`,
        // eslint-disable-next-line @typescript-eslint/max-params -- Log hooks intentionally keep positional arguments
        (error, sourceInstrumentId, targetInstrumentId, operatedAt, tx) =>
            `throw sourceInstrumentId=${sourceInstrumentId} targetInstrumentId=${targetInstrumentId} operatedAt=${operatedAt.toISOString()} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
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

    private async resolveCurrentBaseExchangeRate(sourceInstrumentId: number, targetInstrumentId: number): Promise<number> {
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

        return await this.valueMicroUnitEntry({
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
}

export const entryBaseValuationService = new EntryBaseValuationService();
