import {
    TransactionConsolidationTypeEnum,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import type { TransactionEntityInterface } from '@budgie/contracts';

export class UnconsolidationService extends Context.Service<UnconsolidationService>()('@budgie/consolidation/UnconsolidationService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;

        const isPreExistingCanonical = (transaction: TransactionEntityInterface | undefined): boolean => {
            if (!isDefined(transaction)) {
                return false;
            }

            return (
                transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
                isDefined(transaction.externalId) ||
                isDefined(transaction.externalSource)
            );
        };

        return {
            unconsolidateById: Effect.fn('UnconsolidationService.unconsolidateById')(function* (transactionId: number) {
                const canonical = yield* transactionRepository.getByIdRaw(transactionId);

                yield* transactionEntryRepository.moveBackToOriginalTransactions(transactionId);
                yield* transactionConsolidationRepository.clearConsolidationParent(transactionId);

                if (isPreExistingCanonical(canonical)) {
                    yield* transactionConsolidationRepository.setConsolidationType(transactionId, null);

                    return;
                }

                yield* transactionTagsRepository.deleteByTransactionId(transactionId);
                yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
                yield* transactionRepository.deleteById(transactionId);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(UnconsolidationService, UnconsolidationService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            TransactionTagsRepository.layer
        ])
    );
}
