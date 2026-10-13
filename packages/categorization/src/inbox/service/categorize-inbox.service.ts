import { CategorySourceEnum, Db, TagSourceEnum, TransactionRepository, TransactionUpdatedByEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionEmbeddingRepository } from '../../embedding/repository/transaction-embedding.repository';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { TransactionCategorizeInboxRepository } from '../repository/transaction-categorize-inbox.repository';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { DbError } from '@budgie/contracts';

export class CategorizeInboxService extends Context.Service<CategorizeInboxService>()('@budgie/categorization/CategorizeInboxService', {
    make: Effect.gen(function* () {
        const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;

        const transactionRepository = yield* TransactionRepository;

        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;

        const touchUpdated = Effect.fn('CategorizeInboxService.touchUpdated')(function* (transactionIds: number[]) {
            yield* transactionRepository.touchUpdatedByIds(transactionIds, TransactionUpdatedByEnum.USER);

            return transactionIds;
        });

        const applyLabel = Effect.fn('CategorizeInboxService.applyLabel')(function* (
            labelKind: CategorizeInboxLabelKindEnum,
            transactionIds: number[],
            labelId: number,
            tagSource: TagSourceEnum
        ) {
            if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
                return yield* touchUpdated(
                    yield* transactionCategorizeInboxRepository.addTagByTransactionIds(transactionIds, labelId, tagSource)
                );
            }

            const updatedTransactionIds = yield* transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
                transactionIds,
                labelId,
                CategorySourceEnum.INBOX
            );

            yield* transactionEmbeddingRepository.touchAndMarkForEmbeddingByIds(updatedTransactionIds);

            return updatedTransactionIds;
        });

        const groupAssignmentsByLabelId = (
            assignments: CategorizeInboxAssignmentInterface[]
        ): Map<number, CategorizeInboxAssignmentInterface[]> => {
            const groupedByLabelId = new Map<number, CategorizeInboxAssignmentInterface[]>();

            for (const assignment of assignments) {
                const labelAssignments = groupedByLabelId.get(assignment.labelId) ?? [];
                labelAssignments.push(assignment);
                groupedByLabelId.set(assignment.labelId, labelAssignments);
            }

            return groupedByLabelId;
        };

        const narrowToApplied = (
            assignments: CategorizeInboxAssignmentInterface[],
            appliedTransactionIds: ReadonlySet<number>
        ): CategorizeInboxAssignmentInterface[] =>
            assignments
                .map(assignment => ({ ...assignment, rows: assignment.rows.filter(row => appliedTransactionIds.has(row.transactionId)) }))
                .filter(assignment => isNotEmptyArray(assignment.rows));

        const applyByLabel = Effect.fn('CategorizeInboxService.applyByLabel')(function* (
            assignments: CategorizeInboxAssignmentInterface[],
            applyLabel: (transactionIds: number[], labelId: number) => Effect.Effect<number[], DbError, Db>
        ) {
            const applied: CategorizeInboxAssignmentInterface[] = [];

            for (const [labelId, labelAssignments] of groupAssignmentsByLabelId(assignments)) {
                const appliedTransactionIds = yield* applyLabel(
                    labelAssignments.flatMap(assignment => assignment.rows.map(row => row.transactionId)),
                    labelId
                );

                applied.push(...narrowToApplied(labelAssignments, new Set(appliedTransactionIds)));
            }

            return applied;
        });

        const assign = Effect.fn('CategorizeInboxService.assign')(
            function* (
                labelKind: CategorizeInboxLabelKindEnum,
                assignments: CategorizeInboxAssignmentInterface[],
                tagSource: TagSourceEnum = TagSourceEnum.INBOX
            ) {
                return yield* applyByLabel(assignments, (transactionIds, labelId) =>
                    applyLabel(labelKind, transactionIds, labelId, tagSource)
                );
            },
            effect => Db.transaction(effect)
        );

        const revertLabel = Effect.fn('CategorizeInboxService.revertLabel')(function* (
            labelKind: CategorizeInboxLabelKindEnum,
            transactionIds: number[],
            labelId: number
        ) {
            if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
                return yield* touchUpdated(yield* transactionCategorizeInboxRepository.removeTagByTransactionIds(transactionIds, labelId));
            }

            return yield* transactionCategorizeInboxRepository.clearCategoryByTransactionIds(transactionIds, labelId);
        });

        const undo = Effect.fn('CategorizeInboxService.undo')(
            function* (labelKind: CategorizeInboxLabelKindEnum, assignments: CategorizeInboxAssignmentInterface[]) {
                yield* applyByLabel(assignments, (transactionIds, labelId) => revertLabel(labelKind, transactionIds, labelId));
            },
            effect => Db.transaction(effect)
        );

        return { assign, undo };
    })
}) {
    static readonly layer = Layer.effect(CategorizeInboxService, CategorizeInboxService.make).pipe(
        Layer.provide([TransactionCategorizeInboxRepository.layer, TransactionRepository.layer, TransactionEmbeddingRepository.layer])
    );
}
