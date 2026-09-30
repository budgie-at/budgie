import { UnconsolidationService } from '@budgie/consolidation';
import {
    CategorySourceEnum,
    Db,
    TransactionCategorizeInboxRepository,
    TransactionRepository,
    TransactionEmbeddingRepository,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TransferConsolidationService } from '../../sync/service/transfer-consolidation.service';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { DbError } from '@budgie/contracts';

export class CategorizeInboxService extends Context.Service<CategorizeInboxService>()('@budgie/app/CategorizeInboxService', {
    make: Effect.gen(function* () {
        const transactionCategorizeInboxRepository = yield* TransactionCategorizeInboxRepository;

        const transactionRepository = yield* TransactionRepository;

        const transactionEmbeddingRepository = yield* TransactionEmbeddingRepository;

        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

        const transferConsolidationService = yield* TransferConsolidationService;

        const unconsolidationService = yield* UnconsolidationService;

        const touchUpdated = Effect.fn('CategorizeInboxService.touchUpdated')(function* (transactionIds: number[]) {
            yield* transactionRepository.touchUpdatedByIds(transactionIds, TransactionUpdatedByEnum.USER);

            return transactionIds;
        });

        const applyLabel = Effect.fn('CategorizeInboxService.applyLabel')(function* (
            labelKind: CategorizeInboxLabelKindEnum,
            transactionIds: number[],
            labelId: number
        ) {
            if (labelKind === CategorizeInboxLabelKindEnum.TAG) {
                return yield* touchUpdated(yield* transactionCategorizeInboxRepository.addTagByTransactionIds(transactionIds, labelId));
            }

            const updatedTransactionIds = yield* transactionCategorizeInboxRepository.updateUncategorizedCategoryByTransactionIds(
                transactionIds,
                labelId,
                CategorySourceEnum.USER
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
            function* (labelKind: CategorizeInboxLabelKindEnum, assignments: CategorizeInboxAssignmentInterface[]) {
                return yield* applyByLabel(assignments, (transactionIds, labelId) => applyLabel(labelKind, transactionIds, labelId));
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

        const filterByConsolidation = Effect.fnUntraced(function* (transactionIds: number[], isConsolidated: boolean) {
            const transactions = yield* transactionRepository.findByIds(transactionIds);

            return transactions
                .filter(transaction => isDefined(transaction.consolidationParentTransactionId) === isConsolidated)
                .map(transaction => transaction.id);
        });

        const moveToCash = Effect.fn('CategorizeInboxService.moveToCash')(function* (transactionIds: number[]) {
            const unconsolidatedTransactionIds = yield* filterByConsolidation(transactionIds, false);

            yield* transferConsolidationService.moveAtmCashWithdrawalsToCash(unconsolidatedTransactionIds);

            return yield* filterByConsolidation(unconsolidatedTransactionIds, true);
        });

        const undoMoveToCash = Effect.fn('CategorizeInboxService.undoMoveToCash')(
            function* (transactionIds: number[]) {
                const transactions = yield* transactionRepository.findByIds(transactionIds);
                const transferIds = new Set(
                    transactions.map(transaction => transaction.consolidationParentTransactionId).filter(isDefined)
                );

                yield* Effect.forEach(transferIds, transferId => unconsolidationService.unconsolidateById(transferId), { discard: true });
                yield* accountBalanceIncrementalService.updateAllBalances(true);
            },
            effect => Db.transaction(effect)
        );

        return { assign, undo, moveToCash, undoMoveToCash };
    })
}) {
    static readonly layer = Layer.effect(CategorizeInboxService, CategorizeInboxService.make).pipe(
        Layer.provide([
            TransactionCategorizeInboxRepository.layer,
            TransactionRepository.layer,
            TransactionEmbeddingRepository.layer,
            AccountBalanceIncrementalService.layer,
            TransferConsolidationService.layer,
            UnconsolidationService.layer
        ])
    );
}
