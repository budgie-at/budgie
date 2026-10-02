import { CategorizeInboxLabelKindEnum, CategorizeInboxService } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';

import { useCategorizeInboxMoveToCash } from './use-categorize-inbox-move-to-cash.hook';
import { useCategorizeInboxWriteQueue } from './use-categorize-inbox-write-queue.hook';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

const toTransactionIds = (assignments: CategorizeInboxAssignmentInterface[]): number[] =>
    assignments.flatMap(assignment => assignment.rows.map(row => row.transactionId));

export const useCategorizeInboxActions = (
    strategy: CategorizeInboxStrategyInterface,
    visibility: CategorizeInboxVisibilityInterface
): CategorizeInboxActionsInterface => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const [lastWrite, setLastWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);
    const enqueueWrite = useCategorizeInboxWriteQueue();

    const moveToCashActions = useCategorizeInboxMoveToCash(visibility, enqueueWrite, setLastWrite);

    const assign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        visibility.hideTransactions(toTransactionIds(assignments));
        enqueueWrite(
            Effect.gen(function* () {
                const categorizeInboxService = yield* CategorizeInboxService;
                const applied = yield* categorizeInboxService.assign(strategy.labelKind, assignments);

                if (isNotEmptyArray(applied)) {
                    moveToCashActions.resetMovedToCash();
                    setLastWrite({ assignments: applied, followUpAssignments: [] });
                    hapticNotification(NotificationFeedbackType.Success);
                }
            }),
            () => void visibility.showTransactions(toTransactionIds(assignments)),
            strategy.writeFailed
        );
    };

    const assignLabels = (source: Omit<CategorizeInboxAssignmentInterface, 'labelId'>, labelIds: number[] | null): void => {
        if (isNotEmptyArray(labelIds) && isNotEmptyArray(source.rows)) {
            assign(labelIds.map(labelId => ({ ...source, labelId })));
        }
    };

    const pickLabels = async (source: Omit<CategorizeInboxAssignmentInterface, 'labelId'>, suggestedLabelIds: number[]): Promise<void> =>
        void assignLabels(source, await strategy.pickLabels(source.displayTitle, suggestedLabelIds));

    const undo = (write: CategorizeInboxLastWriteInterface): void => {
        setLastWrite(null);
        visibility.showTransactions(toTransactionIds(write.assignments));
        enqueueWrite(
            Effect.gen(function* () {
                const categorizeInboxService = yield* CategorizeInboxService;
                if (isNotEmptyArray(write.followUpAssignments)) {
                    yield* categorizeInboxService.undo(CategorizeInboxLabelKindEnum.TAG, write.followUpAssignments);
                }

                yield* categorizeInboxService.undo(strategy.labelKind, write.assignments);
            }),
            () => void setLastWrite(previous => previous ?? write),
            strategy.writeFailed
        );
    };

    const applyFollowUp = async (write: CategorizeInboxLastWriteInterface): Promise<void> => {
        const tagIds = await strategy.pickFollowUpTagIds?.(write.assignments[0]);

        if (isNotEmptyArray(tagIds)) {
            enqueueWrite(
                Effect.gen(function* () {
                    const categorizeInboxService = yield* CategorizeInboxService;
                    const followUpAssignments = yield* categorizeInboxService.assign(
                        CategorizeInboxLabelKindEnum.TAG,
                        tagIds.map(labelId => ({ ...write.assignments[0], labelId }))
                    );

                    setLastWrite(previous => (previous === write ? { ...write, followUpAssignments } : previous));
                    hapticNotification(NotificationFeedbackType.Success);
                }),
                emptyFn,
                t`Could not tag transactions`
            );
        }
    };

    return {
        lastWrite,
        undo,
        applyFollowUp,
        movedToCashTransactionIds: moveToCashActions.movedToCashTransactionIds,
        undoMoveToCash: moveToCashActions.undoMoveToCash,
        contextValue: {
            strategy,
            ...visibility,
            assign,
            assignCluster: (cluster, labelId) => void assignLabels({ ...cluster, rows: visibility.includedRows(cluster) }, [labelId]),
            pickClusterLabels: cluster => pickLabels({ ...cluster, rows: visibility.includedRows(cluster) }, cluster.candidateLabelIds),
            pickRowLabels: row =>
                pickLabels({ key: String(row.transactionId), displayTitle: row.title, rows: [row], ruleConditionValue: '' }, []),
            moveToCash: moveToCashActions.moveToCash
        }
    };
};
