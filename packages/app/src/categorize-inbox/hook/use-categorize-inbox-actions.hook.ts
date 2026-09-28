import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { CategorizeInboxLabelKindEnum } from '../enum/categorize-inbox-label-kind.enum';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';

const toTransactionIds = (assignments: CategorizeInboxAssignmentInterface[]): number[] =>
    assignments.flatMap(assignment => assignment.rows.map(row => row.transactionId));

export const useCategorizeInboxActions = (
    strategy: CategorizeInboxStrategyInterface,
    visibility: CategorizeInboxVisibilityInterface
): CategorizeInboxActionsInterface => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const [lastWrite, setLastWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);
    const writeQueueRef = useRef(Promise.resolve());

    const enqueueWrite = (write: () => Promise<void>, rollback: () => void, failedMessage: string): void => {
        writeQueueRef.current = writeQueueRef.current.then(write).catch((error: unknown) => {
            rollback();
            hapticNotification(NotificationFeedbackType.Error);
            showErrorToast(failedMessage, getErrorMessage(error));
        });
    };

    const assign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        visibility.hideTransactions(toTransactionIds(assignments));
        enqueueWrite(
            async () => {
                const applied = await categorizeInboxService.assign(strategy.labelKind, assignments);

                if (isNotEmptyArray(applied)) {
                    setLastWrite({ assignments: applied, followUpAssignments: [] });
                    hapticNotification(NotificationFeedbackType.Success);
                }
            },
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
            async () => {
                if (isNotEmptyArray(write.followUpAssignments)) {
                    await categorizeInboxService.undo(CategorizeInboxLabelKindEnum.TAG, write.followUpAssignments);
                }

                await categorizeInboxService.undo(strategy.labelKind, write.assignments);
            },
            () => void setLastWrite(previous => previous ?? write),
            strategy.writeFailed
        );
    };

    const applyFollowUp = async (write: CategorizeInboxLastWriteInterface): Promise<void> => {
        const tagIds = await strategy.pickFollowUpTagIds?.(write.assignments[0]);

        if (isNotEmptyArray(tagIds)) {
            enqueueWrite(
                async () => {
                    const followUpAssignments = await categorizeInboxService.assign(
                        CategorizeInboxLabelKindEnum.TAG,
                        tagIds.map(labelId => ({ ...write.assignments[0], labelId }))
                    );

                    setLastWrite(previous => (previous === write ? { ...write, followUpAssignments } : previous));
                    hapticNotification(NotificationFeedbackType.Success);
                },
                emptyFn,
                t`Could not tag transactions`
            );
        }
    };

    return {
        lastWrite,
        undo,
        applyFollowUp,
        contextValue: {
            strategy,
            ...visibility,
            assign,
            assignCluster: (cluster, labelId) => void assignLabels({ ...cluster, rows: visibility.includedRows(cluster) }, [labelId]),
            pickClusterLabels: cluster => pickLabels({ ...cluster, rows: visibility.includedRows(cluster) }, cluster.candidateLabelIds),
            pickRowLabels: row =>
                pickLabels({ key: String(row.transactionId), displayTitle: row.title, rows: [row], ruleConditionValue: '' }, [])
        }
    };
};
