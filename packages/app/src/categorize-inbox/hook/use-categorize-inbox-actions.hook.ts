import { CategorizeInboxService } from '@budgie/categorization';
import { TransactionDebtSettlementService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { toCategorizeInboxTransactionIds } from '../utils/to-categorize-inbox-transaction-ids.util';

import { useCategorizeInboxLastWriteState } from './use-categorize-inbox-last-write-state.hook';
import { useCategorizeInboxLastWrite } from './use-categorize-inbox-last-write.hook';
import { useCategorizeInboxMoveToCash } from './use-categorize-inbox-move-to-cash.hook';
import { useCategorizeInboxTransfer } from './use-categorize-inbox-transfer.hook';
import { useCategorizeInboxWriteQueue } from './use-categorize-inbox-write-queue.hook';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';
import type { CategorizeInboxDataInterface } from '../interface/categorize-inbox-data.interface';
import type { CategorizeInboxLastWriteInterface } from '../interface/categorize-inbox-last-write.interface';
import type { CategorizeInboxStrategyInterface } from '../interface/categorize-inbox-strategy.interface';
import type { CategorizeInboxAssignmentInterface } from '@budgie/categorization';

export const useCategorizeInboxActions = (
    strategy: CategorizeInboxStrategyInterface,
    inbox: CategorizeInboxDataInterface
): Omit<CategorizeInboxContextValueInterface, 'items' | 'isLoading'> => {
    const { t } = useLingui();
    const router = useRouter();
    const { visibility, remainingCount, categorizedCount, acceptableAssignments, cashWithdrawalTransactionIds } = inbox;
    const [hapticNotification] = useVibration();
    const [lastWrite, setLastWrite] = useState<CategorizeInboxLastWriteInterface | null>(null);
    const lastWriteContext = useCategorizeInboxLastWriteState(strategy.labelKind, lastWrite);
    const enqueueWrite = useCategorizeInboxWriteQueue();
    const { resetMovedToCash, ...moveToCashActions } = useCategorizeInboxMoveToCash(visibility, enqueueWrite, setLastWrite);
    const { commitPendingTransfer, ...transferActions } = useCategorizeInboxTransfer(
        visibility,
        enqueueWrite,
        setLastWrite,
        resetMovedToCash
    );

    const { undo, applyFollowUp, addClusterTags } = useCategorizeInboxLastWrite(strategy, visibility, enqueueWrite, setLastWrite);

    const assign = (assignments: CategorizeInboxAssignmentInterface[]): void => {
        commitPendingTransfer();
        visibility.hideTransactions(toCategorizeInboxTransactionIds(assignments));
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
            () => void visibility.showTransactions(toCategorizeInboxTransactionIds(assignments)),
            strategy.writeFailed
        );
    };

    const assignLabels = (source: Omit<CategorizeInboxAssignmentInterface, 'labelId'>, labelIds: number[] | null): void => {
        if (isNotEmptyArray(labelIds) && isNotEmptyArray(source.rows)) {
            assign(labelIds.map(labelId => ({ ...source, labelId })));
        }
    };

    const pickLabels = (source: Omit<CategorizeInboxAssignmentInterface, 'labelId'>, suggestedLabelIds: number[]): void =>
        void strategy.pickLabels(source.displayTitle, suggestedLabelIds, labelIds => {
            if (isNotEmptyArray(labelIds) && isNotEmptyArray(source.rows)) {
                assignLabels(source, labelIds);
                router.dismissTo('/categorize');
            }
        });

    return {
        strategy,
        ...visibility,
        remainingCount,
        categorizedCount,
        acceptableAssignments,
        cashWithdrawalTransactionIds,
        ...lastWriteContext,
        assign,
        assignCluster: (cluster, labelId) => void assignLabels({ ...cluster, rows: visibility.includedRows(cluster) }, [labelId]),
        addClusterTags: cluster => void addClusterTags(cluster, visibility.includedRows(cluster)),
        pickClusterLabels: cluster => void pickLabels({ ...cluster, rows: visibility.includedRows(cluster) }, cluster.candidateLabelIds),
        ...transferActions,
        ...moveToCashActions,
        moveToCash: transactionIds => {
            commitPendingTransfer();
            moveToCashActions.moveToCash(transactionIds);
        },
        attachDebt: (transactionIds, debtAccountId) => {
            commitPendingTransfer();
            visibility.hideTransactions(transactionIds);
            enqueueWrite(
                Effect.gen(function* () {
                    const transactionDebtSettlementService = yield* TransactionDebtSettlementService;

                    yield* transactionDebtSettlementService.attachMany(transactionIds, debtAccountId);
                    setLastWrite(null);
                    resetMovedToCash();
                    hapticNotification(NotificationFeedbackType.Success);
                }),
                () => void visibility.showTransactions(transactionIds),
                t`Could not attach debt`
            );
        },
        undo,
        applyFollowUp
    };
};
