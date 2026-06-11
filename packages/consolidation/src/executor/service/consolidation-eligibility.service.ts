import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type { DB, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class ConsolidationEligibilityService {
    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {}

    @Log(
        (sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `enter check sourceIds=${sourceTransactionIds.join(',')} allowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `done eligible=${String(result)} sourceIds=${sourceTransactionIds.join(',')} allowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))}`,
        (error, sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `throw check sourceIds=${sourceTransactionIds.join(',')} allowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    async areCandidatesStillEligible(
        sourceTransactionIds: number[],
        tx: DB,
        allowedMovedSourceTransactionIds: number[] = []
    ): Promise<boolean> {
        return isDefined(await this.findEligibleSourceTransactions(sourceTransactionIds, tx, allowedMovedSourceTransactionIds));
    }

    @Log(
        (sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `enter load ids=${sourceTransactionIds.join(',')} movedAllowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `done loaded=${result?.map(transaction => transaction.id).join(',') ?? ''} ids=${sourceTransactionIds.join(',')} movedAllowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))}`,
        (error, sourceTransactionIds, tx, allowedMovedSourceTransactionIds = []) =>
            `throw load ids=${sourceTransactionIds.join(',')} movedAllowed=${allowedMovedSourceTransactionIds.join(',')} tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
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

    @Log(
        (sourceTransactionIds, existingTransferId, tx) =>
            `enter sourceTransactionIds=${sourceTransactionIds.join(',')} existingTransferId=${existingTransferId} hasTx=${String(isDefined(tx))}`,
        (result, sourceTransactionIds, existingTransferId, tx) =>
            `done sourceTransactionIds=${sourceTransactionIds.join(',')} existingTransferId=${existingTransferId} hasTx=${String(isDefined(tx))} result=${String(result)}`,
        (error, sourceTransactionIds, existingTransferId, tx) =>
            `throw sourceTransactionIds=${sourceTransactionIds.join(',')} existingTransferId=${existingTransferId} hasTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
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
