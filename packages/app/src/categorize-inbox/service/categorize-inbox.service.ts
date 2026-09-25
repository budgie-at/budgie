import { CategorySourceEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, transactionCategorizeInboxRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { InvalidateDatabaseLiveQuery } from '../../@generic/drizzle/decorator/invalidate-database-live-query.decorator';
import { microPause } from '../../@generic/utils/micro-pause.util';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { DB } from '@budgie/contracts';

class CategorizeInboxService {
    @Log(
        (transactionIds, categoryId) => `enter transactionCount=${transactionIds.length} categoryId=${categoryId}`,
        (result, transactionIds, categoryId) =>
            `done assignedCount=${result.length} transactionCount=${transactionIds.length} categoryId=${categoryId}`,
        (error, transactionIds, categoryId) =>
            `throw transactionCount=${transactionIds.length} categoryId=${categoryId} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async assign(transactionIds: number[], categoryId: number): Promise<number[]> {
        return transactionAsync(db, tx => this.applyChunk(transactionIds, categoryId, tx));
    }

    @Log(
        assignments => `enter assignmentCount=${assignments.length}`,
        (result, assignments) => `done appliedCount=${result.length} assignmentCount=${assignments.length}`,
        (error, assignments) => `throw assignmentCount=${assignments.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async assignMany(assignments: CategorizeInboxAssignmentInterface[]): Promise<CategorizeInboxAssignmentInterface[]> {
        const groupedByCategoryId = this.groupAssignmentsByCategoryId(assignments);

        return transactionAsync(db, tx =>
            [...groupedByCategoryId].reduce<Promise<CategorizeInboxAssignmentInterface[]>>(
                async (previousAppliedPromise, [categoryId, categoryAssignments]) => {
                    const previousApplied = await previousAppliedPromise;
                    const transactionIds = categoryAssignments.flatMap(assignment => assignment.transactionIds);
                    const updatedTransactionIds = await this.applyChunk(transactionIds, categoryId, tx);

                    return [...previousApplied, ...this.narrowToUpdated(categoryAssignments, new Set(updatedTransactionIds))];
                },
                Promise.resolve([])
            )
        );
    }

    @Log(
        assignments => `enter assignmentCount=${assignments.length}`,
        (...[, assignments]) => `done assignmentCount=${assignments.length}`,
        (error, assignments) => `throw assignmentCount=${assignments.length} error=${getErrorMessage(error)}`
    )
    @InvalidateDatabaseLiveQuery()
    async undo(assignments: CategorizeInboxAssignmentInterface[]): Promise<void> {
        await assignments.reduce<Promise<void>>(async (previousAssignmentPromise, assignment) => {
            await previousAssignmentPromise;
            await transactionAsync(db, async tx => {
                await transactionCategorizeInboxRepository.clearCategoryByTransactionIds(
                    assignment.transactionIds,
                    assignment.categoryId,
                    tx
                );
            });
            await microPause();
        }, Promise.resolve());
    }

    @Log(
        (transactionIds, categoryId, tx) =>
            `enter transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (result, transactionIds, categoryId, tx) =>
            `done updatedCount=${result.length} transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))}`,
        (error, transactionIds, categoryId, tx) =>
            `throw transactionCount=${transactionIds.length} categoryId=${categoryId} inTx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    private async applyChunk(transactionIds: number[], categoryId: number, tx: DB): Promise<number[]> {
        const updatedTransactionIds = await transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
            transactionIds,
            categoryId,
            CategorySourceEnum.USER,
            tx
        );

        await transactionRepository.markForEmbeddingByIds(updatedTransactionIds, tx);
        await transactionRepository.touchUpdatedAtByIds(updatedTransactionIds, tx);

        return updatedTransactionIds;
    }

    private narrowToUpdated(
        assignments: CategorizeInboxAssignmentInterface[],
        updatedTransactionIds: ReadonlySet<number>
    ): CategorizeInboxAssignmentInterface[] {
        return assignments
            .map(assignment => ({
                ...assignment,
                transactionIds: assignment.transactionIds.filter(transactionId => updatedTransactionIds.has(transactionId))
            }))
            .filter(assignment => isNotEmptyArray(assignment.transactionIds));
    }

    private groupAssignmentsByCategoryId(
        assignments: CategorizeInboxAssignmentInterface[]
    ): Map<number, CategorizeInboxAssignmentInterface[]> {
        const groupedByCategoryId = new Map<number, CategorizeInboxAssignmentInterface[]>();

        for (const assignment of assignments) {
            const categoryAssignments = groupedByCategoryId.get(assignment.categoryId) ?? [];
            categoryAssignments.push(assignment);
            groupedByCategoryId.set(assignment.categoryId, categoryAssignments);
        }

        return groupedByCategoryId;
    }
}

export const categorizeInboxService = new CategorizeInboxService();
