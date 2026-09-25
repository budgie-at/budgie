import { AccountTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { showErrorToast } from '../../@generic/utils/show-error-toast/show-error-toast';
import { useAccountSelectorModal } from '../../account/context/account-selector-modal.context';
import { useCategorySelectorModal } from '../../category/context/category-selector-modal.context';
import { useNonSystemCategoriesQuery } from '../../category/query/use-non-system-categories.query';
import { AnalyticsTransactionsModeEnum } from '../../transaction/enum/analytics-transactions-mode.enum';
import { transactionTransferService } from '../../transaction/service/transaction-transfer.service';
import { buildUncategorizedRouteParams } from '../../transaction/utils/build-uncategorized-route-params.util';
import { CategorizeInboxTransferKindEnum } from '../enum/categorize-inbox-transfer-kind.enum';
import { categorizeInboxService } from '../service/categorize-inbox.service';

import type { CategorizeInboxActionsInterface } from '../interface/categorize-inbox-actions.interface';
import type { CategorizeInboxAssignmentInterface } from '../interface/categorize-inbox-assignment.interface';
import type { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import type { CategorizeInboxInterface } from '../interface/categorize-inbox.interface';
import type { CategorizeInboxRowInterface, TransactionFilterInterface } from '@budgie/contracts';

const UNDO_STACK_LIMIT = 5;
const ACCEPT_SUMMARY_TOP_CATEGORY_COUNT = 5;

// eslint-disable-next-line max-lines-per-function, max-statements -- Orchestration hook owns every Categorize Inbox handler, busy state, and the undo stack
export const useCategorizeInboxActions = (
    inbox: CategorizeInboxInterface,
    filters: TransactionFilterInterface
): CategorizeInboxActionsInterface => {
    const { t } = useLingui();
    const router = useRouter();
    const { categories } = useNonSystemCategoriesQuery();

    const [excludedTransactionIds, setExcludedTransactionIds] = useState<Set<number>>(new Set());
    const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);
    const [undoStack, setUndoStack] = useState<CategorizeInboxAssignmentInterface[][]>([]);

    const [openAccountSelector] = useAccountSelectorModal();
    const [openCategorySelector] = useCategorySelectorModal();

    const pushUndoEntry = (assignments: CategorizeInboxAssignmentInterface[]): void =>
        void setUndoStack(previous => [assignments, ...previous].slice(0, UNDO_STACK_LIMIT));

    const handleToggleExpanded = (key: string): void => void setExpandedClusterKey(previous => (previous === key ? null : key));

    const handleToggleExcluded = (transactionId: number): void =>
        void setExcludedTransactionIds(previous => {
            const next = new Set(previous);

            if (next.has(transactionId)) {
                next.delete(transactionId);
            } else {
                next.add(transactionId);
            }

            return next;
        });

    const handleAssignCluster = async (cluster: CategorizeInboxClusterInterface, categoryId: number): Promise<void> => {
        const transactionIds = cluster.rows
            .map(row => row.transactionId)
            .filter(transactionId => !excludedTransactionIds.has(transactionId));

        if (isEmptyArray(transactionIds)) {
            return;
        }

        setIsBusy(true);
        try {
            const assignments = await categorizeInboxService.assignMany([
                { clusterKey: cluster.key, categoryId, transactionIds, ruleConditionValue: cluster.ruleConditionValue }
            ]);
            pushUndoEntry(assignments);
        } catch (error) {
            showErrorToast(t`Could not categorize transactions`, getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const handleAssignRow = async (row: CategorizeInboxRowInterface, categoryId: number): Promise<void> => {
        setIsBusy(true);
        try {
            const transactionIds = await categorizeInboxService.assign([row.transactionId], categoryId);
            pushUndoEntry([{ clusterKey: `row-${row.transactionId}`, categoryId, transactionIds, ruleConditionValue: row.title }]);
        } catch (error) {
            showErrorToast(t`Could not categorize transactions`, getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const handlePickOtherCategory = async (cluster: CategorizeInboxClusterInterface): Promise<void> => {
        const categoryId = await openCategorySelector({ description: cluster.displayTitle });

        if (isDefined(categoryId)) {
            await handleAssignCluster(cluster, categoryId);
        }
    };

    // eslint-disable-next-line max-statements -- Handles ATM vs card-transfer account selection, confirmation, and the transfer service call
    const handleConvertClusterToTransfer = async (cluster: CategorizeInboxClusterInterface): Promise<void> => {
        const isAtmWithdrawal = cluster.transferKind === CategorizeInboxTransferKindEnum.ATM_WITHDRAWAL;
        const accountId = isAtmWithdrawal
            ? await openAccountSelector({
                  includeAccountTypes: [AccountTypeEnum.CASH],
                  excludeAccountId: cluster.sourceAccountId,
                  onlyActive: true,
                  emptyStateDescription: t`Create a cash account to track ATM withdrawals`
              })
            : await openAccountSelector({ excludeAccountTypes: [AccountTypeEnum.DEBT], excludeAccountId: cluster.sourceAccountId });

        if (!isDefined(accountId)) {
            return;
        }

        const transactionIds = cluster.rows
            .map(row => row.transactionId)
            .filter(transactionId => !excludedTransactionIds.has(transactionId));

        if (isEmptyArray(transactionIds)) {
            return;
        }

        const confirmed = await confirmAlert({
            title: t({
                message: plural(transactionIds.length, {
                    one: 'Convert # transaction to transfer?',
                    other: 'Convert # transactions to transfers?'
                })
            }),
            confirmText: t`Convert`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        const transactionType = cluster.type === TransactionTypeEnum.INCOME ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE;

        setIsBusy(true);
        try {
            const result = await transactionTransferService.convertManyToTransfer(transactionIds, transactionType, accountId);

            if (isPositiveNumber(result.failed)) {
                showErrorToast(t`Some transactions could not be converted`, t`Please try again later`);
            }
        } catch (error) {
            showErrorToast(t`Some transactions could not be converted`, getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const confidentAssignments = inbox.confidentAssignments
        .map(assignment => ({
            ...assignment,
            transactionIds: assignment.transactionIds.filter(transactionId => !excludedTransactionIds.has(transactionId))
        }))
        .filter(assignment => isNotEmptyArray(assignment.transactionIds));
    const confidentRowCount = confidentAssignments.reduce((total, assignment) => total + assignment.transactionIds.length, 0);

    const buildAcceptSummaryMessage = (): string => {
        const rowCountByCategoryId = new Map<number, number>();

        for (const assignment of confidentAssignments) {
            const previousCount = rowCountByCategoryId.get(assignment.categoryId) ?? 0;
            rowCountByCategoryId.set(assignment.categoryId, previousCount + assignment.transactionIds.length);
        }

        const sortedEntries = [...rowCountByCategoryId.entries()].sort(([, firstCount], [, secondCount]) => secondCount - firstCount);
        const topEntries = sortedEntries.slice(0, ACCEPT_SUMMARY_TOP_CATEGORY_COUNT);
        const remainingCategoryCount = sortedEntries.length - topEntries.length;
        const topLines = topEntries.map(([categoryId, rowCount]) => {
            const categoryTitle = categories.find(category => category.id === categoryId)?.title ?? t`Uncategorized`;

            return `${categoryTitle} — ${rowCount}`;
        });
        const moreLine = isPositiveNumber(remainingCategoryCount)
            ? [t({ message: plural(remainingCategoryCount, { one: '+# more category', other: '+# more categories' }) })]
            : [];

        return [...topLines, ...moreLine].join('\n');
    };

    const handleAcceptConfident = async (): Promise<void> => {
        if (isEmptyArray(confidentAssignments)) {
            return;
        }

        const confirmed = await confirmAlert({
            title: t({
                message: plural(confidentRowCount, { one: 'Accept # confident suggestion?', other: 'Accept # confident suggestions?' })
            }),
            message: buildAcceptSummaryMessage(),
            confirmText: t`Accept`,
            cancelText: t`Cancel`
        });

        if (!confirmed) {
            return;
        }

        setIsBusy(true);
        try {
            const applied = await categorizeInboxService.assignMany(confidentAssignments);
            pushUndoEntry(applied);
        } catch (error) {
            showErrorToast(t`Could not categorize transactions`, getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const handleUndo = async (): Promise<void> => {
        const latestUndoEntry = undoStack.at(0);

        if (!isDefined(latestUndoEntry)) {
            return;
        }

        setIsBusy(true);
        try {
            await categorizeInboxService.undo(latestUndoEntry);
            setUndoStack(previous => previous.slice(1));
        } catch (error) {
            showErrorToast(t`Could not categorize transactions`, getErrorMessage(error));
        } finally {
            setIsBusy(false);
        }
    };

    const handleDismissUndo = (): void => void setUndoStack(previous => previous.slice(1));

    const handleUndoPress = (): void => void handleUndo();

    const handleAcceptConfidentPress = (): void => void handleAcceptConfident();

    const handleGoBack = (): void => void router.back();

    const handleShowList = (): void => {
        router.replace({
            pathname: '/analytics/transactions',
            params: buildUncategorizedRouteParams(filters, AnalyticsTransactionsModeEnum.UNCATEGORIZED)
        });
    };

    const latestUndoAssignments = undoStack.at(0);
    const assignedRowCount = (latestUndoAssignments ?? []).reduce((total, assignment) => total + assignment.transactionIds.length, 0);
    const singleAssignment = isDefined(latestUndoAssignments) && latestUndoAssignments.length === 1 ? latestUndoAssignments[0] : null;

    const contextValue = {
        excludedTransactionIds,
        expandedClusterKey,
        isBusy,
        toggleExpanded: handleToggleExpanded,
        toggleExcluded: handleToggleExcluded,
        assignCluster: handleAssignCluster,
        assignRow: handleAssignRow,
        pickOtherCategory: handlePickOtherCategory,
        convertClusterToTransfer: handleConvertClusterToTransfer
    };

    return {
        contextValue,
        confidentRowCount,
        undoAssignments: latestUndoAssignments ?? null,
        assignedRowCount,
        singleAssignment,
        handleAcceptConfidentPress,
        handleUndoPress,
        handleDismissUndo,
        handleShowList,
        handleGoBack
    };
};
