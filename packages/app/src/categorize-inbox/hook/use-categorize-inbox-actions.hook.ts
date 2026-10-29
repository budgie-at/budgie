import { CategorizeInboxLabelKindEnum, CategorizeInboxService } from '@budgie/categorization';
import { TagSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useState } from 'react';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';

import { useCategorizeInboxConvertToTransfer } from './use-categorize-inbox-convert-to-transfer.hook';
import { useCategorizeInboxMoveToCash } from './use-categorize-inbox-move-to-cash.hook';
import { useCategorizeInboxWriteQueue } from './use-categorize-inbox-write-queue.hook';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';
import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

const toTransactionIds = (assignments: CategorizeInboxAssignmentInterface[]): number[] =>
    assignments.flatMap(assignment => assignment.rows.map(row => row.transactionId));

export const useCategorizeInboxActions = (
    strategy: CategorizeInboxStrategyInterface,
    inbox: CategorizeInboxDataInterface
): CategorizeInboxContextValueInterface => {
    const { visibility, items, isLoading, ...inboxSummary } = inbox;
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const [lastWrite, setLastWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);
    const enqueueWrite = useCategorizeInboxWriteQueue();
    const { resetMovedToCash, ...moveToCashActions } = useCategorizeInboxMoveToCash(visibility, enqueueWrite, setLastWrite);
    const transferActions = useCategorizeInboxConvertToTransfer(visibility, enqueueWrite);

    const assign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        visibility.hideTransactions(toTransactionIds(assignments));
        enqueueWrite(
            Effect.gen(function* () {
                const categorizeInboxService = yield* CategorizeInboxService;
                const applied = yield* categorizeInboxService.assign(strategy.labelKind, assignments);

                if (isNotEmptyArray(applied)) {
                    resetMovedToCash();
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

    const pickLabels = (source: Omit<CategorizeInboxAssignmentInterface, 'labelId'>, suggestedLabelIds: number[]): void =>
        void strategy.pickLabels(source.displayTitle, suggestedLabelIds, labelIds => void assignLabels(source, labelIds));

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

    const applyFollowUp = (write: CategorizeInboxLastWriteInterface): void => {
        strategy.pickFollowUpTagIds?.(write.assignments[0], tagIds => {
            if (isNotEmptyArray(tagIds)) {
                enqueueWrite(
                    Effect.gen(function* () {
                        const categorizeInboxService = yield* CategorizeInboxService;
                        const followUpAssignments = yield* categorizeInboxService.assign(
                            CategorizeInboxLabelKindEnum.TAG,
                            tagIds.map(labelId => ({ ...write.assignments[0], labelId })),
                            TagSourceEnum.USER
                        );

                        setLastWrite(previous => (previous === write ? { ...write, followUpAssignments } : previous));
                        hapticNotification(NotificationFeedbackType.Success);
                    }),
                    emptyFn,
                    t`Could not tag transactions`
                );
            }
        });
    };

    return {
        strategy,
        ...visibility,
        ...inboxSummary,
        lastWrite,
        assign,
        assignCluster: (cluster, labelId) => void assignLabels({ ...cluster, rows: visibility.includedRows(cluster) }, [labelId]),
        pickClusterLabels: cluster => void pickLabels({ ...cluster, rows: visibility.includedRows(cluster) }, cluster.candidateLabelIds),
        pickRowLabels: row =>
            void pickLabels({ key: String(row.transactionId), displayTitle: row.title, rows: [row], ruleConditionValue: '' }, []),
        ...transferActions,
        ...moveToCashActions,
        undo,
        applyFollowUp
    };
};
