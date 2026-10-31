import { CategorizeInboxSelectionEnum } from '../enum/categorize-inbox-selection.enum';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

export const getCategorizeInboxSelection = (
    rows: readonly CategorizeInboxRowInterface[],
    excludedTransactionIds: ReadonlySet<number>
): CategorizeInboxSelectionEnum => {
    const includedCount = rows.filter(row => !excludedTransactionIds.has(row.transactionId)).length;

    if (includedCount === rows.length) {
        return CategorizeInboxSelectionEnum.INCLUDED;
    }

    return includedCount === 0 ? CategorizeInboxSelectionEnum.EXCLUDED : CategorizeInboxSelectionEnum.PARTIAL;
};
