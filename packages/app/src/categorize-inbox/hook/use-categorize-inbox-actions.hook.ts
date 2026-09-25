import { useLingui } from '@lingui/react/macro';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useState } from 'react';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

const PERCENT_MULTIPLIER = 100;

// eslint-disable-next-line max-statements -- Orchestration hook owns the inbox busy state, exclusions, expansion and the single undo
export const useCategorizeInboxActions = (totalRowCount: number): CategorizeInboxActionsInterface => {
    const { t } = useLingui();
    const { categories } = useNonSystemCategoriesQuery();
    const [hapticNotification] = useVibration();

    const [excludedTransactionIds, setExcludedTransactionIds] = useState<ReadonlySet<number>>(new Set());
    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [undoAssignments, setUndoAssignments] = useState<CategorizeInboxAssignmentInterface[] | null>(null);
    const [initialRowCount, setInitialRowCount] = useState(totalRowCount);

    if (totalRowCount > initialRowCount) {
        setInitialRowCount(totalRowCount);
    }

    const runExclusive = async (action: () => Promise<void>): Promise<void> => {
        setIsBusy(true);
        try {
            await action();
        } finally {
            setIsBusy(false);
        }
    };

    const runAssignment = (action: () => Promise<CategorizeInboxAssignmentInterface[]>): void =>
        void runExclusive(async () => {
            const applied = await action();

            setUndoAssignments(isNotEmptyArray(applied) ? applied : null);

            if (isNotEmptyArray(applied)) {
                hapticNotification(NotificationFeedbackType.Success);
            }
        }).catch((error: unknown) => void showErrorToast(t`Could not categorize transactions`, getErrorMessage(error)));

    const handleAssign = (assignments: CategorizeInboxAssignmentInterface[]): void =>
        void runAssignment(() => categorizeInboxService.assignMany(assignments));

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
        if (isDefined(undoAssignments)) {
            runAssignment(async () => {
                await categorizeInboxService.undo(undoAssignments);

                return [];
            });
        }
    };

    const handleToggleExpanded = (clusterKey: string): void =>
        void setExpandedClusterKey(previous => (previous === clusterKey ? null : clusterKey));

    const handleToggleExcluded = (transactionId: number): void =>
        void setExcludedTransactionIds(previous => {
            const next = new Set(previous);

            if (!next.delete(transactionId)) {
                next.add(transactionId);
            }

            return next;
        });

    return {
        progress: isPositiveNumber(initialRowCount) ? ((initialRowCount - totalRowCount) / initialRowCount) * PERCENT_MULTIPLIER : 0,
        contextValue: {
            categoriesById: new Map(categories.map(category => [category.id, category])),
            excludedTransactionIds,
            expandedClusterKey,
            isBusy,
            undoAssignments,
            toggleExpanded: handleToggleExpanded,
            toggleExcluded: handleToggleExcluded,
            assign: handleAssign,
            assignCluster: handleAssignCluster,
            assignRow: handleAssignRow,
            undo: handleUndo,
            runExclusive
        }
    };
};
