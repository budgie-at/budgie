import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useCategorizeInboxStrategy } from '../context/categorize-inbox-strategy.context';

import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxWritesInterface } from '../interface/categorize-inbox-writes.interface';

export const useCategorizeInboxWrites = ({
    hideTransactions,
    showTransactions
}: Pick<CategorizeInboxVisibilityInterface, 'hideTransactions' | 'showTransactions'>): CategorizeInboxWritesInterface => {
    const [hapticNotification] = useVibration();
    const { assignMany, undo, copy } = useCategorizeInboxStrategy();

    const [undoAssignments, setUndoAssignments] = useState<CategorizeInboxAssignmentInterface[] | null>(null);
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
    const pendingWriteCountRef = useRef(0);

    const handleWriteSettled = (): void => {
        pendingWriteCountRef.current -= 1;

        if (pendingWriteCountRef.current === 0) {
            writeQueueRef.current = Promise.resolve();
        }
    };

    const enqueueWrite = (write: () => Promise<void>, rollback: () => void): void => {
        pendingWriteCountRef.current += 1;
        writeQueueRef.current = writeQueueRef.current
            .then(write)
            .catch((error: unknown) => {
                rollback();
                hapticNotification(NotificationFeedbackType.Error);
                showErrorToast(copy.writeFailed, getErrorMessage(error));
            })
            .finally(handleWriteSettled);
    };

    const runAssignment = async (assignments: CategorizeInboxAssignmentInterface[]): Promise<void> => {
        const applied = await assignMany(assignments);

        if (isNotEmptyArray(applied)) {
            setUndoAssignments(applied);
            hapticNotification(NotificationFeedbackType.Success);
        }
    };

    const handleAssign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        const transactionIds = assignments.flatMap(assignment => assignment.transactionIds);

        hideTransactions(transactionIds);
        enqueueWrite(
            () => runAssignment(assignments),
            () => void showTransactions(transactionIds)
        );
    };

    const handleUndo = (): void => {
        if (!isDefined(undoAssignments)) {
            return;
        }

        setUndoAssignments(null);
        showTransactions(undoAssignments.flatMap(assignment => assignment.transactionIds));
        enqueueWrite(
            () => undo(undoAssignments),
            () => void setUndoAssignments(previous => previous ?? undoAssignments)
        );
    };

    return { undoAssignments, assign: handleAssign, undo: handleUndo };
};
