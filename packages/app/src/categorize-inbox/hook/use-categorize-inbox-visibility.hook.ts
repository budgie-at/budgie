import { useState } from 'react';

import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxRowInterface } from '@budgie/contracts';

const keepPresentTransactionIds = (
    transactionIds: ReadonlySet<number>,
    presentTransactionIds: ReadonlySet<number>
): ReadonlySet<number> => {
    const keptTransactionIds = new Set([...transactionIds].filter(transactionId => presentTransactionIds.has(transactionId)));

    return keptTransactionIds.size === transactionIds.size ? transactionIds : keptTransactionIds;
};

export const useCategorizeInboxVisibility = (rows: CategorizeInboxRowInterface[]): CategorizeInboxVisibilityInterface => {
    const [excludedTransactionIds, setExcludedTransactionIds] = useState<ReadonlySet<number>>(new Set());
    const [hiddenTransactionIds, setHiddenTransactionIds] = useState<ReadonlySet<number>>(new Set());
    const [prunedRows, setPrunedRows] = useState(rows);

    if (prunedRows !== rows) {
        const presentTransactionIds = new Set(rows.map(row => row.transactionId));

        setPrunedRows(rows);
        setHiddenTransactionIds(previous => keepPresentTransactionIds(previous, presentTransactionIds));
        setExcludedTransactionIds(previous => keepPresentTransactionIds(previous, presentTransactionIds));
    }

    const handleHideTransactions = (transactionIds: readonly number[]): void =>
        void setHiddenTransactionIds(previous => new Set([...previous, ...transactionIds]));

    const handleShowTransactions = (transactionIds: readonly number[]): void =>
        void setHiddenTransactionIds(previous => {
            const next = new Set(previous);

            transactionIds.forEach(transactionId => next.delete(transactionId));

            return next;
        });

    const handleToggleExcluded = (transactionId: number): void =>
        void setExcludedTransactionIds(previous => {
            const next = new Set(previous);

            if (!next.delete(transactionId)) {
                next.add(transactionId);
            }

            return next;
        });

    return {
        hiddenTransactionIds,
        excludedTransactionIds,
        toggleExcluded: handleToggleExcluded,
        hideTransactions: handleHideTransactions,
        showTransactions: handleShowTransactions
    };
};
