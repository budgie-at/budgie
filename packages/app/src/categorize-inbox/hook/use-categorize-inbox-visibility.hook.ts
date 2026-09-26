import { useState } from 'react';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';

import type { CategorizeInboxSectionEnum } from '../enum/categorize-inbox-section.enum';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxInterface } from '../interface/categorize-inbox.interface';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

export const useCategorizeInboxVisibility = (inbox: CategorizeInboxInterface): CategorizeInboxVisibilityInterface => {
    const [excludedTransactionIds, setExcludedTransactionIds] = useState<ReadonlySet<number>>(new Set());
    const [hiddenTransactionIds, setHiddenTransactionIds] = useState<ReadonlySet<number>>(new Set());

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

    const visibleItems = inbox.items.flatMap((item): CategorizeInboxListItemType[] => {
        if (item.kind === CategorizeInboxListItemKindEnum.SECTION_HEADER) {
            return [item];
        }

        const rows = item.cluster.rows.filter(row => !hiddenTransactionIds.has(row.transactionId));

        return isNotEmptyArray(rows) ? [{ ...item, cluster: { ...item.cluster, rows } }] : [];
    });
    const rowCountBySection = new Map<CategorizeInboxSectionEnum, number>();

    visibleItems.forEach(item => {
        if (item.kind === CategorizeInboxListItemKindEnum.CLUSTER) {
            rowCountBySection.set(item.cluster.section, (rowCountBySection.get(item.cluster.section) ?? 0) + item.cluster.rows.length);
        }
    });

    return {
        items: visibleItems.flatMap((item): CategorizeInboxListItemType[] => {
            if (item.kind === CategorizeInboxListItemKindEnum.CLUSTER) {
                return [item];
            }

            const count = rowCountBySection.get(item.section) ?? 0;

            return isPositiveNumber(count) ? [{ ...item, count }] : [];
        }),
        acceptableAssignments: inbox.confidentAssignments
            .map(assignment => ({
                ...assignment,
                transactionIds: assignment.transactionIds.filter(
                    transactionId => !excludedTransactionIds.has(transactionId) && !hiddenTransactionIds.has(transactionId)
                )
            }))
            .filter(assignment => isNotEmptyArray(assignment.transactionIds)),
        remainingCount: [...rowCountBySection.values()].reduce((total, rowCount) => total + rowCount, 0),
        excludedTransactionIds,
        toggleExcluded: handleToggleExcluded,
        hideTransactions: handleHideTransactions,
        showTransactions: handleShowTransactions
    };
};
