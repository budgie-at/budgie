import { InstrumentRepository } from '@budgie/contracts';
import { convertToMicroUnits } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { TransactionCreateInputInterface } from '@budgie/contracts';

export class BinanceSourceQuoteService extends Context.Service<BinanceSourceQuoteService>()('@budgie/sync/BinanceSourceQuoteService', {
    make: Effect.gen(function* () {
        const instrumentRepository = yield* InstrumentRepository;

        const resolve = Effect.fn('BinanceSourceQuoteService.resolve')(function* (transaction: SyncTransactionInterface) {
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

        return {
            resolve,
            applyToInput: Effect.fn('BinanceSourceQuoteService.applyToInput')(function* (
                input: TransactionCreateInputInterface,
                transaction: SyncTransactionInterface
            ) {
                const quote = yield* resolve(transaction);

                return isDefined(quote)
                    ? {
                          ...input,
                          entries: input.entries.map(entry => (entry.externalId === transaction.id ? { ...entry, ...quote } : entry))
                      }
                    : input;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BinanceSourceQuoteService, BinanceSourceQuoteService.make).pipe(
        Layer.provide(InstrumentRepository.layer)
    );
}
