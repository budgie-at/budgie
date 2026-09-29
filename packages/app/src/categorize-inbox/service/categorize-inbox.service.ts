import { CategorySourceEnum, Db, TransactionUpdatedByEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import { transactionCategorizeInboxRepository, transactionRepository } from '../../@generic/drizzle/db/db';
import { invalidateDatabaseLiveQuery } from '../../@generic/drizzle/utils/invalidate-database-live-query.util';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { DbError } from '@budgie/contracts';

class CategorizeInboxService {
    readonly assign = Effect.fn('CategorizeInboxService.assign')(
        function* (
            this: CategorizeInboxService,
            labelKind: CategorizeInboxLabelKindEnum,
            assignments: CategorizeInboxAssignmentInterface[]
        ) {
            return yield* this.applyByLabel(assignments, (transactionIds, labelId) => this.applyLabel(labelKind, transactionIds, labelId));
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    readonly undo = Effect.fn('CategorizeInboxService.undo')(
        function* (
            this: CategorizeInboxService,
            labelKind: CategorizeInboxLabelKindEnum,
            assignments: CategorizeInboxAssignmentInterface[]
        ) {
            yield* this.applyByLabel(assignments, (transactionIds, labelId) => this.revertLabel(labelKind, transactionIds, labelId));
        },
        effect => Db.transaction(effect),
        invalidateDatabaseLiveQuery
    );

    private readonly applyLabel = Effect.fn('CategorizeInboxService.applyLabel')(function* (
        this: CategorizeInboxService,
        labelKind: CategorizeInboxLabelKindEnum,
        transactionIds: number[],
        labelId: number
    ) {
        if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
            return yield* this.touchUpdated(yield* transactionCategorizeInboxRepository.addTagByTransactionIds(transactionIds, labelId));
        }

        const updatedTransactionIds = yield* transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
            transactionIds,
            labelId,
            CategorySourceEnum.USER
        );

        yield* transactionRepository.touchAndMarkForEmbeddingByIds(updatedTransactionIds);

        return updatedTransactionIds;
    });

    private readonly revertLabel = Effect.fn('CategorizeInboxService.revertLabel')(function* (
        this: CategorizeInboxService,
        labelKind: CategorizeInboxLabelKindEnum,
        transactionIds: number[],
        labelId: number
    ) {
        if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
            return yield* this.touchUpdated(yield* transactionCategorizeInboxRepository.removeTagByTransactionIds(transactionIds, labelId));
        }

        return yield* transactionCategorizeInboxRepository.clearCategoryByTransactionIds(transactionIds, labelId);
    });

    private readonly touchUpdated = Effect.fn('CategorizeInboxService.touchUpdated')(function* (transactionIds: number[]) {
        yield* transactionRepository.touchUpdatedByIds(transactionIds, TransactionUpdatedByEnum.USER);

        return transactionIds;
    });

    private readonly applyByLabel = Effect.fn('CategorizeInboxService.applyByLabel')(function* (
        this: CategorizeInboxService,
        assignments: CategorizeInboxAssignmentInterface[],
        applyLabel: (transactionIds: number[], labelId: number) => Effect.Effect<number[], DbError, Db>
    ) {
        const applied: CategorizeInboxAssignmentInterface[] = [];

        for (const [labelId, labelAssignments] of this.groupAssignmentsByLabelId(assignments)) {
            const appliedTransactionIds = yield* applyLabel(
                labelAssignments.flatMap(assignment => assignment.rows.map(row => row.transactionId)),
                labelId
            );

            applied.push(...this.narrowToApplied(labelAssignments, new Set(appliedTransactionIds)));
        }

        return applied;
    });

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
