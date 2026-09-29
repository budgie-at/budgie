import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { instrumentRepository } from '../../@generic/drizzle/db/db';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { TransactionCreateInputInterface } from '@budgie/contracts';
import type { SyncTransactionInterface } from '@budgie/sync';

class BinanceSourceQuoteService {
    readonly resolve = Effect.fn('BinanceSourceQuoteService.resolve')(function* (transaction: SyncTransactionInterface) {
        if (
            !isNotEmptyString(transaction.quotedCurrencyCode) ||
            !isPositiveNumber(transaction.quotedAmount) ||
            !isPositiveNumber(transaction.quotedUnitPrice)
        ) {
            return null;
        }

        const instrument = yield* instrumentRepository.findByCode(transaction.quotedCurrencyCode);
        if (!isDefined(instrument)) {
            return null;
        }

        return {
            quotedInstrumentId: instrument.id,
            quotedAmount: convertToMicroUnits(transaction.quotedAmount),
            quotedUnitPrice: convertToMicroUnits(transaction.quotedUnitPrice)
        };
    });

    readonly applyToInput = Effect.fn('BinanceSourceQuoteService.applyToInput')(function* (
        this: BinanceSourceQuoteService,
        input: TransactionCreateInputInterface,
        transaction: SyncTransactionInterface
    ) {
        const quote = yield* this.resolve(transaction);

        return isDefined(quote)
            ? {
                  ...input,
                  entries: input.entries.map(entry => (entry.externalId === transaction.id ? { ...entry, ...quote } : entry))
              }
            : input;
    });
}

export const binanceSourceQuoteService = new BinanceSourceQuoteService();
