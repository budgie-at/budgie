import { CategorizeInboxSectionEnum } from '@budgie/categorization';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { CategorizeInboxAcceptAllButton } from '../categorize-inbox-accept-all-button/categorize-inbox-accept-all-button';
import { CategorizeInboxMoveAllToCashButton } from '../categorize-inbox-move-all-to-cash-button/categorize-inbox-move-all-to-cash-button';
import { CategorizeInboxMovedToCashUndo } from '../categorize-inbox-moved-to-cash-undo/categorize-inbox-moved-to-cash-undo';
import { CategorizeInboxPanelFooter } from '../categorize-inbox-panel-footer/categorize-inbox-panel-footer';
import { CategorizeInboxTransferUndo } from '../categorize-inbox-transfer-undo/categorize-inbox-transfer-undo';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';

import type { ReactElement } from 'react';

interface Props {
    readonly activeSection: CategorizeInboxSectionEnum | null;
    readonly children?: ReactElement | null;
}

export const CategorizeInboxPanel = ({ activeSection, children }: Props) => {
    const {
        items,
        includedRows,
        acceptableAssignments,
        cashWithdrawalTransactionIds,
        lastWrite,
        movedToCashTransactionIds,
        pendingTransfer
    } = useCategorizeInboxContext();

    const transferUndo = isDefined(pendingTransfer) ? <CategorizeInboxTransferUndo key="transfer-undo" /> : null;
    const labelUndo = isDefined(lastWrite) ? <CategorizeInboxUndoBar key="label-undo" /> : null;
    const movedToCashUndo = isNotEmptyArray(movedToCashTransactionIds) ? <CategorizeInboxMovedToCashUndo key="moved-to-cash-undo" /> : null;
    const cashRows = items
        .filter(isCategorizeInboxCluster)
        .filter(cluster => cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS)
        .flatMap(cluster => includedRows(cluster))
        .filter(row => cashWithdrawalTransactionIds.has(row.transactionId));
    const acceptAll = isNotEmptyArray(acceptableAssignments) ? <CategorizeInboxAcceptAllButton key="accept-all" /> : null;
    const moveAllToCash = isNotEmptyArray(cashRows) ? <CategorizeInboxMoveAllToCashButton key="move-all-to-cash" rows={cashRows} /> : null;
    const sectionActions: Record<CategorizeInboxSectionEnum, ReactElement | null> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: acceptAll,
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: moveAllToCash,
        [CategorizeInboxSectionEnum.REVIEW]: null,
        [CategorizeInboxSectionEnum.OLDER]: null,
        [CategorizeInboxSectionEnum.ONE_OFFS]: null
    };
    const primaryAction = isDefined(activeSection) ? sectionActions[activeSection] : acceptAll;
    const undo = transferUndo ?? labelUndo ?? movedToCashUndo;
    const slot = isDefined(children) ? children : (undo ?? primaryAction);
    const doneUndo = isDefined(children) ? undo : null;

    if (!isDefined(slot)) {
        return null;
    }

    return <CategorizeInboxPanelFooter slot={slot} leading={doneUndo} />;
};
