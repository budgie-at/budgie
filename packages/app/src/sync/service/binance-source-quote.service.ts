import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { BinanceSourceQuoteInterface } from '../interface/binance-source-quote.interface';

import type { TransactionCreateInputInterface } from '@budgie/contracts';
import type { SyncTransactionInterface } from '@budgie/sync';

class BinanceSourceQuoteService {
    async resolve(transaction: SyncTransactionInterface): Promise<BinanceSourceQuoteInterface | null> {
        if (
            !isNotEmptyString(transaction.quotedCurrencyCode) ||
            !isPositiveNumber(transaction.quotedAmount) ||
            !isPositiveNumber(transaction.quotedUnitPrice)
        ) {
            return null;
        }

        const instrument = await instrumentRepository.findByCode(transaction.quotedCurrencyCode);
        if (!isDefined(instrument)) {
            return null;
        }

        return {
            quotedInstrumentId: instrument.id,
            quotedAmount: convertToMicroUnits(transaction.quotedAmount),
            quotedUnitPrice: convertToMicroUnits(transaction.quotedUnitPrice)
        };
    }

    async applyToInput(
        input: TransactionCreateInputInterface,
        transaction: SyncTransactionInterface
    ): Promise<TransactionCreateInputInterface> {
        const quote = await this.resolve(transaction);

        return isDefined(quote)
            ? {
                  ...input,
                  entries: input.entries.map(entry => (entry.externalId === transaction.id ? { ...entry, ...quote } : entry))
              }
            : input;
    }
}

export const binanceSourceQuoteService = new BinanceSourceQuoteService();
