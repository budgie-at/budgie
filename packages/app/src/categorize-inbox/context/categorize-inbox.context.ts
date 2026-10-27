import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { categoryEvidenceAtom, uncategorizedRowsAtom } from '../constant/categorize-inbox-atoms.constant';

import type { CategorizeInboxContextValueInterface } from '../interface/categorize-inbox-context-value.interface';

export const CategorizeInboxContext = createContext<CategorizeInboxContextValueInterface>({
    strategy: {
        labelKind: CategorizeInboxLabelKindEnum.CATEGORY,
        labelsById: new Map(),
        pageTitle: '',
        emptyDescription: '',
        selectLabel: '',
        moreLabels: '',
        pickRowLabel: '',
        writeFailed: '',
        assignAs: () => '',
        assignedCount: () => '',
        doneThisSession: () => '',
        rowsAtom: uncategorizedRowsAtom,
        evidenceAtom: categoryEvidenceAtom,
        pickLabels: emptyFn,
        pickFollowUpTagIds: null,
        buildRuleActions: () => ({ categoryId: null, tagIds: [] }),
        buildListRouteParams: () => ({})
    },
    remainingCount: 0,
    categorizedCount: 0,
    acceptableAssignments: [],
    cashWithdrawalTransactionIds: new Set(),
    lastWrite: null,
    movedToCashTransactionIds: [],
    excludedTransactionIds: new Set(),
    expandedClusterKey: null,
    includedRows: () => [],
    toggleExpanded: emptyFn,
    toggleExcluded: emptyFn,
    hideTransactions: emptyFn,
    showTransactions: emptyFn,
    assign: emptyFn,
    assignCluster: emptyFn,
    pickClusterLabels: emptyFn,
    pickRowLabels: emptyFn,
    moveToCash: emptyFn,
    undo: emptyFn,
    applyFollowUp: emptyFn,
    undoMoveToCash: emptyFn
});

export const useCategorizeInboxContext = () => use(CategorizeInboxContext);
