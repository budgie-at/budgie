import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';

export const CategorizeInboxContext = createContext<CategorizeInboxContextValueInterface>({
    strategy: null,
    items: [],
    isLoading: true,
    remainingCount: 0,
    categorizedCount: 0,
    acceptableAssignments: [],
    cashWithdrawalTransactionIds: new Set(),
    lastWrite: null,
    movedToCashTransactionIds: [],
    excludedTransactionIds: new Set(),
    includedRows: () => [],
    toggleExcluded: emptyFn,
    hideTransactions: emptyFn,
    showTransactions: emptyFn,
    assign: emptyFn,
    assignCluster: emptyFn,
    pickClusterLabels: emptyFn,
    moveToCash: emptyFn,
    pendingTransfer: null,
    learnedTransferAccountIds: new Map(),
    transferCluster: emptyFn,
    undoTransfer: emptyFn,
    undo: emptyFn,
    applyFollowUp: emptyFn,
    undoMoveToCash: emptyFn
});

export const useCategorizeInboxContext = () => use(CategorizeInboxContext);
