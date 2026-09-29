import { CategorySourceEnum, TransactionUpdatedByEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionCategorizeInboxRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { transferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { unconsolidateByIdInTransaction } from '../../transaction/utils/unconsolidate-by-id-in-transaction.util';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { DB } from '@budgie/contracts';

class CategorizeInboxService {
    @Log(
        (labelKind, assignments) => `enter labelKind=${labelKind} assignmentCount=${assignments.length}`,
        (result, labelKind, assignments) =>
            `done labelKind=${labelKind} appliedCount=${result.length} assignmentCount=${assignments.length}`,
        (error, labelKind, assignments) =>
            `throw labelKind=${labelKind} assignmentCount=${assignments.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async assign(
        labelKind: CategorizeInboxLabelKindEnum,
        assignments: CategorizeInboxAssignmentInterface[]
    ): Promise<CategorizeInboxAssignmentInterface[]> {
        return transactionAsync(db, tx =>
            this.applyByLabel(assignments, (transactionIds, labelId) => this.applyLabel(labelKind, transactionIds, labelId, tx))
        );
    }

    @Log(
        (labelKind, assignments) => `enter labelKind=${labelKind} assignmentCount=${assignments.length}`,
        (...[, labelKind, assignments]) => `done labelKind=${labelKind} assignmentCount=${assignments.length}`,
        (error, labelKind, assignments) =>
            `throw labelKind=${labelKind} assignmentCount=${assignments.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async undo(labelKind: CategorizeInboxLabelKindEnum, assignments: CategorizeInboxAssignmentInterface[]): Promise<void> {
        await transactionAsync(db, tx =>
            this.applyByLabel(assignments, (transactionIds, labelId) => this.revertLabel(labelKind, transactionIds, labelId, tx))
        );
    }

    @Log(
        transactionIds => `enter transactionCount=${transactionIds.length}`,
        (result, transactionIds) => `done movedCount=${result.length} transactionCount=${transactionIds.length}`,
        (error, transactionIds) => `throw transactionCount=${transactionIds.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async moveToCash(transactionIds: number[]): Promise<number[]> {
        const unconsolidatedTransactionIds = await this.filterByConsolidation(transactionIds, false);

        await transferConsolidationService.moveAtmCashWithdrawalsToCash(unconsolidatedTransactionIds);

        return this.filterByConsolidation(unconsolidatedTransactionIds, true);
    }

    @Log(
        transactionIds => `enter transactionCount=${transactionIds.length}`,
        (...[, transactionIds]) => `done transactionCount=${transactionIds.length}`,
        (error, transactionIds) => `throw transactionCount=${transactionIds.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async undoMoveToCash(transactionIds: number[]): Promise<void> {
        await transactionAsync(db, async tx => {
            const transactions = await transactionRepository.findByIds(transactionIds, tx);
            const transferIds = new Set(transactions.map(transaction => transaction.consolidationParentTransactionId).filter(isDefined));

            await [...transferIds].reduce(async (previousPromise, transferId) => {
                await previousPromise;
                await unconsolidateByIdInTransaction(transferId, tx);
            }, Promise.resolve());
            await accountBalanceIncrementalService.updateAllBalances(true, tx);
        });
    }

    private async filterByConsolidation(transactionIds: number[], isConsolidated: boolean): Promise<number[]> {
        const transactions = await transactionRepository.findByIds(transactionIds);

        return transactions
            .filter(transaction => isDefined(transaction.consolidationParentTransactionId) === isConsolidated)
            .map(transaction => transaction.id);
    }

    private async applyLabel(
        labelKind: CategorizeInboxLabelKindEnum,
        transactionIds: number[],
        labelId: number,
        tx: DB
    ): Promise<number[]> {
        if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
            return this.touchUpdated(await transactionCategorizeInboxRepository.addTagByTransactionIds(transactionIds, labelId, tx), tx);
        }

        const updatedTransactionIds = await transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
            transactionIds,
            labelId,
            CategorySourceEnum.USER,
            tx
        );

        await transactionRepository.touchAndMarkForEmbeddingByIds(updatedTransactionIds, tx);

        return updatedTransactionIds;
    }

    private async revertLabel(
        labelKind: CategorizeInboxLabelKindEnum,
        transactionIds: number[],
        labelId: number,
        tx: DB
    ): Promise<number[]> {
        return labelKind === CategorizeInboxLabelKindEnum.TAG
            ? this.touchUpdated(await transactionCategorizeInboxRepository.removeTagByTransactionIds(transactionIds, labelId, tx), tx)
            : transactionCategorizeInboxRepository.clearCategoryByTransactionIds(transactionIds, labelId, tx);
    }

    private async touchUpdated(transactionIds: number[], tx: DB): Promise<number[]> {
        await transactionRepository.touchUpdatedByIds(transactionIds, TransactionUpdatedByEnum.USER, tx);

        return transactionIds;
    }

    private async applyByLabel(
        assignments: CategorizeInboxAssignmentInterface[],
        applyLabel: (transactionIds: number[], labelId: number) => Promise<number[]>
    ): Promise<CategorizeInboxAssignmentInterface[]> {
        return [...this.groupAssignmentsByLabelId(assignments)].reduce<Promise<CategorizeInboxAssignmentInterface[]>>(
            async (previousAppliedPromise, [labelId, labelAssignments]) => {
                const previousApplied = await previousAppliedPromise;
                const appliedTransactionIds = await applyLabel(
                    labelAssignments.flatMap(assignment => assignment.rows.map(row => row.transactionId)),
                    labelId
                );

                return [...previousApplied, ...this.narrowToApplied(labelAssignments, new Set(appliedTransactionIds))];
            },
            Promise.resolve([])
        );
    }

    private narrowToApplied(
        assignments: CategorizeInboxAssignmentInterface[],
        appliedTransactionIds: ReadonlySet<number>
    ): CategorizeInboxAssignmentInterface[] {
        return assignments
            .map(assignment => ({ ...assignment, rows: assignment.rows.filter(row => appliedTransactionIds.has(row.transactionId)) }))
            .filter(assignment => isNotEmptyArray(assignment.rows));
    }

    private groupAssignmentsByLabelId(
        assignments: CategorizeInboxAssignmentInterface[]
    ): Map<number, CategorizeInboxAssignmentInterface[]> {
        const groupedByLabelId = new Map<number, CategorizeInboxAssignmentInterface[]>();

        for (const assignment of assignments) {
            const labelAssignments = groupedByLabelId.get(assignment.labelId) ?? [];
            labelAssignments.push(assignment);
            groupedByLabelId.set(assignment.labelId, labelAssignments);
        }

        return groupedByLabelId;
    }
}

export const categorizeInboxService = new CategorizeInboxService();
