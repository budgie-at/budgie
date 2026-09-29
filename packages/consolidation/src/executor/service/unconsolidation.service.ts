import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { UnconsolidationDependenciesInterface } from '../interface/unconsolidation-dependencies.interface';
import type { TransactionEntityInterface } from '@budgie/contracts';

export class UnconsolidationService {
    readonly unconsolidateById = Effect.fn('UnconsolidationService.unconsolidateById')(function* (
        this: UnconsolidationService,
        transactionId: number
    ) {
        const { transactionEntryRepository, transactionRepository, transactionTagsRepository } = this.dependencies;
        const canonical = yield* transactionRepository.getByIdRaw(transactionId);

        yield* transactionEntryRepository.moveBackToOriginalTransactions(transactionId);
        yield* transactionRepository.clearConsolidationParent(transactionId);

        if (this.isPreExistingCanonical(canonical)) {
            yield* transactionRepository.setConsolidationType(transactionId, null);

            return;
        }

        yield* transactionTagsRepository.deleteByTransactionId(transactionId);
        yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
        yield* transactionRepository.deleteById(transactionId);
    });

    constructor(private readonly dependencies: UnconsolidationDependenciesInterface) {}

    private isPreExistingCanonical(transaction: TransactionEntityInterface | undefined): boolean {
        if (!isDefined(transaction)) {
            return false;
        }

        return (
            transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
            isDefined(transaction.externalId) ||
            isDefined(transaction.externalSource)
        );
    }
}
