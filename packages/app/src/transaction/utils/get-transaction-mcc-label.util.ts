import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionMccLabel = (transaction: TransactionWithRelationsEntityInterface): string | null => {
    const mccCategory = getTransactionCategoryEntries(transaction.entries).at(0)?.mccCategory;

    return isDefined(mccCategory) ? `${mccCategory.mcc} · ${mccCategory.shortDescription.replaceAll(/\.\s+/gu, ', ')}` : null;
};
