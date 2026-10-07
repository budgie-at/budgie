import { InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import { convertToMicroUnits } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CURRENCY_CODE_BY_NUMERIC_CODE } from '../constant/currency-code-by-numeric-code.constant';

import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export class SyncOperationMetadataService extends Context.Service<SyncOperationMetadataService>()(
    '@budgie/sync/SyncOperationMetadataService',
    {
        make: Effect.gen(function* () {
            const instrumentRepository = yield* InstrumentRepository;

            const resolveOperation = (
                transaction: SyncTransactionInterface,
                instrumentIdByCode: ReadonlyMap<string, number>
            ): Required<Pick<TransactionEntryCreateInputInterface, 'operationInstrumentId' | 'operationAmount'>> | null => {
                const currencyCode = isDefined(transaction.operationCurrencyCode)
                    ? CURRENCY_CODE_BY_NUMERIC_CODE[transaction.operationCurrencyCode]
                    : null;
                const operationInstrumentId = instrumentIdByCode.get(currencyCode ?? '');
                const operationAmount = Math.abs(transaction.operationAmount);

                return isDefined(operationInstrumentId) && isPositiveNumber(operationAmount)
                    ? { operationInstrumentId, operationAmount: convertToMicroUnits(operationAmount) }
                    : null;
            };

            const applyToInput = (
                input: TransactionCreateInputInterface,
                transactionById: ReadonlyMap<string, SyncTransactionInterface>,
                instrumentIdByCode: ReadonlyMap<string, number>
            ): TransactionCreateInputInterface => {
                const transaction = transactionById.get(input.externalId ?? '');
                const operation = isDefined(transaction) ? resolveOperation(transaction, instrumentIdByCode) : null;

                if (!isDefined(transaction) || !isDefined(operation)) {
                    return input;
                }

                return {
                    ...input,
                    entries: input.entries.map(entry => (entry.externalId === transaction.id ? { ...entry, ...operation } : entry))
                };
            };

            return {
                applyToInputs: Effect.fn('SyncOperationMetadataService.applyToInputs')(function* (
                    inputs: readonly TransactionCreateInputInterface[],
                    transactions: readonly SyncTransactionInterface[]
                ) {
                    const instruments = yield* instrumentRepository.findByType(InstrumentTypeEnum.FIAT);
                    const instrumentIdByCode = new Map(instruments.map(instrument => [instrument.code, instrument.id]));
                    const transactionById = new Map(transactions.map(transaction => [transaction.id, transaction]));

                    return inputs.map(input => applyToInput(input, transactionById, instrumentIdByCode));
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(SyncOperationMetadataService, SyncOperationMetadataService.make).pipe(
        Layer.provide(InstrumentRepository.layer)
    );
}
