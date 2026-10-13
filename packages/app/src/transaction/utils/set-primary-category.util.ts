import { CategorySourceEnum, TransactionEntryCreateInputInterface } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

export const setPrimaryCategory = (
    entries: readonly TransactionEntryCreateInputInterface[],
    categoryId: number
): TransactionEntryCreateInputInterface[] | null => {
    const [primaryEntry] = getTransactionCategoryEntries(entries);

    if (!isDefined(primaryEntry)) {
        return null;
    }

    return entries.map(entry => (entry === primaryEntry ? { ...entry, categoryId, categorySource: CategorySourceEnum.USER } : entry));
};
