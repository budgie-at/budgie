import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import { useCategorizeInboxVisibility } from './use-categorize-inbox-visibility.hook';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxInterface } from '../interface/categorize-inbox.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

const PERCENT_MULTIPLIER = 100;

// eslint-disable-next-line max-statements -- Orchestration hook owns the inbox writes, optimistic hiding, expansion and the single undo
export const useCategorizeInboxActions = (inbox: CategorizeInboxInterface): CategorizeInboxActionsInterface => {
    const { t } = useLingui();
    const { categories } = useNonSystemCategoriesQuery();
    const [hapticNotification] = useVibration();

    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const [undoAssignments, setUndoAssignments] = useState<CategorizeInboxAssignmentInterface[] | null>(null);
    const [initialRowCount, setInitialRowCount] = useState(inbox.totalRowCount);
    const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
    const { items, acceptableAssignments, remainingCount, excludedTransactionIds, toggleExcluded, hideTransactions, showTransactions } =
        useCategorizeInboxVisibility(inbox);

    if (inbox.totalRowCount > initialRowCount) {
        setInitialRowCount(inbox.totalRowCount);
    }

    const enqueueWrite = (write: () => Promise<void>, rollback: () => void): void => {
        writeQueueRef.current = writeQueueRef.current.then(write).catch((error: unknown) => {
            rollback();
            hapticNotification(NotificationFeedbackType.Error);
            showErrorToast(t`Could not categorize transactions`, getErrorMessage(error));
        });
    };

    const runAssignment = async (assignments: CategorizeInboxAssignmentInterface[]): Promise<void> => {
        const applied = await categorizeInboxService.assignMany(assignments);

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

    const handleAssignCluster = (cluster: CategorizeInboxClusterInterface, categoryId: number): void => {
        const transactionIds = cluster.rows
            .map(row => row.transactionId)
            .filter(transactionId => !excludedTransactionIds.has(transactionId));

        if (isEmptyArray(transactionIds)) {
            return;
        }

        handleAssign([{ clusterKey: cluster.key, categoryId, transactionIds, ruleConditionValue: cluster.ruleConditionValue }]);
    };

    const handleAssignRow = (row: CategorizeInboxRowInterface, categoryId: number): void =>
        void handleAssign([
            { clusterKey: String(row.transactionId), categoryId, transactionIds: [row.transactionId], ruleConditionValue: '' }
        ]);

    const handleUndo = (): void => {
        if (!isDefined(undoAssignments)) {
            return;
        }

        setUndoAssignments(null);
        showTransactions(undoAssignments.flatMap(assignment => assignment.transactionIds));

        enqueueWrite(
            () => categorizeInboxService.undo(undoAssignments),
            () => void setUndoAssignments(previous => previous ?? undoAssignments)
        );
    };

    const handleToggleExpanded = (clusterKey: string): void =>
        void setExpandedClusterKey(previous => (previous === clusterKey ? null : clusterKey));

    const categorizedCount = initialRowCount - remainingCount;
    const sessionRowCount = categorizedCount + remainingCount;

    return {
        items,
        acceptableAssignments,
        remainingCount,
        categorizedCount,
        progress: isPositiveNumber(sessionRowCount) ? (categorizedCount / sessionRowCount) * PERCENT_MULTIPLIER : 0,
        contextValue: {
            categoriesById: new Map(categories.map(category => [category.id, category])),
            excludedTransactionIds,
            expandedClusterKey,
            undoAssignments,
            toggleExpanded: handleToggleExpanded,
            toggleExcluded,
            hideTransactions,
            showTransactions,
            assign: handleAssign,
            assignCluster: handleAssignCluster,
            assignRow: handleAssignRow,
            undo: handleUndo
        }
    };
};
