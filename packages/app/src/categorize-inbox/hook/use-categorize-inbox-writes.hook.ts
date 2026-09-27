import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';

import { emptyFn, getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxWritesInterface } from '../interface/categorize-inbox-writes.interface';

export const useCategorizeInboxWrites = ({
    hideTransactions,
    showTransactions
}: Pick<CategorizeInboxVisibilityInterface, 'hideTransactions' | 'showTransactions'>): CategorizeInboxWritesInterface => {
    const [hapticNotification] = useVibration();
    const { assignMany, undo, followUp, copy } = useCategorizeInboxStrategy();

    const [lastWrite, setLastWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
    const pendingWriteCountRef = useRef(0);
    const writeSequenceRef = useRef(0);

    const handleWriteSettled = (): void => {
        pendingWriteCountRef.current -= 1;

        if (pendingWriteCountRef.current === 0) {
            writeQueueRef.current = Promise.resolve();
        }
    };

    const enqueueWrite = (write: () => Promise<void>, rollback: () => void, failedMessage: string): Promise<void> => {
        pendingWriteCountRef.current += 1;
        writeQueueRef.current = writeQueueRef.current
            .then(write)
            .catch((error: unknown) => {
                rollback();
                hapticNotification(NotificationFeedbackType.Error);
                showErrorToast(failedMessage, getErrorMessage(error));
            })
            .finally(handleWriteSettled);

        return writeQueueRef.current;
    };

    const runAssignment = async (assignments: CategorizeInboxAssignmentInterface[]): Promise<void> => {
        const applied = await assignMany(assignments);

        if (isNotEmptyArray(applied)) {
            writeSequenceRef.current += 1;
            setLastWrite({ sequence: writeSequenceRef.current, assignments: applied, followUpAssignments: [] });
            hapticNotification(NotificationFeedbackType.Success);
        }
    };

    const runUndo = async ({ assignments, followUpAssignments }: CategorizeInboxLastWriteInterface): Promise<void> => {
        if (isNotEmptyArray(followUpAssignments)) {
            await followUp?.undo(followUpAssignments);
        }

        await undo(assignments);
    };

    const handleAssign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        const transactionIds = assignments.flatMap(assignment => assignment.transactionIds);

        hideTransactions(transactionIds);
        void enqueueWrite(
            () => runAssignment(assignments),
            () => void showTransactions(transactionIds),
            copy.writeFailed
        );
    };

    const handleApplyFollowUp = async (assignment: CategorizeInboxAssignmentInterface): Promise<void> => {
        const labelIds = await followUp?.pickLabelIds(assignment);

        if (!isDefined(followUp) || !isDefined(lastWrite) || !isNotEmptyArray(labelIds)) {
            return;
        }

        await enqueueWrite(
            async () => {
                const applied = await followUp.assignMany(labelIds.map(labelId => ({ ...assignment, labelId })));

                setLastWrite(previous =>
                    previous?.sequence === lastWrite.sequence
                        ? { ...previous, followUpAssignments: [...previous.followUpAssignments, ...applied] }
                        : previous
                );
                hapticNotification(NotificationFeedbackType.Success);
            },
            emptyFn,
            followUp.writeFailed
        );
    };

    const handleUndo = (): void => {
        if (!isDefined(lastWrite)) {
            return;
        }

        setLastWrite(null);
        showTransactions(lastWrite.assignments.flatMap(assignment => assignment.transactionIds));
        void enqueueWrite(
            () => runUndo(lastWrite),
            () => void setLastWrite(previous => previous ?? { ...lastWrite }),
            copy.writeFailed
        );
    };

    return { lastWrite, assign: handleAssign, applyFollowUp: handleApplyFollowUp, undo: handleUndo };
};
