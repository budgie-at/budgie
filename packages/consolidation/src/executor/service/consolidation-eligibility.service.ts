import { Log } from '@budgie/logger';

import { isDefined, isError } from '@rnw-community/shared';

import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type { DB, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class ConsolidationEligibilityService {
    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {}

    @Log.withoutErrorPayload(
        (sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `enter sourceCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length}`,
        (result, sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `done eligible=${String(result)} sourceCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length}`,
        (error, sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `throw sourceCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length} errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async areCandidatesStillEligible(
        sourceTransactionIds: number[],
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<boolean> {
        return isDefined(await this.findEligibleSourceTransactions(sourceTransactionIds, tx, allowedMovedSourceTransactionIds));
    }

    @Log.withoutErrorPayload(
        (sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `enter requestedCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length}`,
        (result, sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `done loadedCount=${result?.length ?? 0} requestedCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length}`,
        (error, sourceTransactionIds, _tx, allowedMovedSourceTransactionIds = []) =>
            `throw requestedCount=${sourceTransactionIds.length} allowedMovedCount=${allowedMovedSourceTransactionIds.length} errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async findEligibleSourceTransactions(
        sourceTransactionIds: number[],
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<TransactionWithEntriesEntityInterface[] | null> {
        const fresh = await this.dependencies.transactionRepository.findByIds(sourceTransactionIds, tx);

        if (fresh.length !== sourceTransactionIds.length) {
            return null;
        }

        const movedEntryBlockedTransactionIds = sourceTransactionIds.filter(
            transactionId => !allowedMovedSourceTransactionIds.includes(transactionId)
        );

        if (await this.dependencies.transactionEntryRepository.hasMovedSourceEntries(movedEntryBlockedTransactionIds, tx)) {
            return null;
        }

        if (fresh.every(transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt))) {
            return fresh;
        }

        return null;
    }

    @Log.withoutErrorPayload(
        sourceTransactionIds => `enter sourceCount=${sourceTransactionIds.length}`,
        (result, sourceTransactionIds) => `done sourceCount=${sourceTransactionIds.length} eligible=${String(result)}`,
        (error, sourceTransactionIds) =>
            `throw sourceCount=${sourceTransactionIds.length} errorClass=${isError(error) ? error.name : 'UnknownError'}`
    )
    async isExistingTransferConsolidationStillEligible(
        sourceTransactionIds: number[],
        existingTransferId: number,
        tx: DB
    ): Promise<boolean> {
        if (!(await this.areCandidatesStillEligible(sourceTransactionIds, tx))) {
            return false;
        }

        return this.isExistingTransferStillEligible(existingTransferId, tx);
    }

    private async isExistingTransferStillEligible(transactionId: number, tx: DB): Promise<boolean> {
        const transaction = await this.dependencies.transactionRepository.getByIdRaw(transactionId, tx);

        return isDefined(transaction) && !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt);
    }
}
