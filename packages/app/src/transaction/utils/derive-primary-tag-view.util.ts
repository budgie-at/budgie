import { isDefined } from '@rnw-community/shared';

import { sortTransactionTagsByPrimary } from './sort-transaction-tags-by-primary.util';

import type { TagEntityInterface, TransactionTagsEntityInterface } from '@budgie/contracts';

interface TransactionTagRow extends Pick<TransactionTagsEntityInterface, 'tagId' | 'isPrimary'> {
    readonly tag: TagEntityInterface;
}

interface PrimaryTagView<T extends TransactionTagRow> {
    readonly sorted: T[];
    readonly primaryRow: T | null;
    readonly primaryTag: TagEntityInterface | null;
    readonly hasMultipleTags: boolean;
    readonly siblingsCount: number;
}

export const derivePrimaryTagView = <T extends TransactionTagRow>(transactionTags: readonly T[]): PrimaryTagView<T> => {
    const sorted = sortTransactionTagsByPrimary(transactionTags);
    const primaryRow = sorted.length > 0 ? sorted[0] : null;

    return {
        sorted,
        primaryRow,
        primaryTag: isDefined(primaryRow) ? primaryRow.tag : null,
        hasMultipleTags: sorted.length > 1,
        siblingsCount: Math.max(0, sorted.length - 1)
    };
};
