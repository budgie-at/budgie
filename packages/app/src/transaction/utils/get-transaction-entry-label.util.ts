import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const getTransactionEntryLabel = (entry: TransactionEntryWithRelationsEntityInterface | undefined, unknownLabel: string): string => {
    if (isNotEmptyString(entry?.category?.title)) {
        return entry.category.title;
    }

    if (isNotEmptyString(entry?.mccCategory?.shortDescription)) {
        return entry.mccCategory.shortDescription;
    }

    return unknownLabel;
};
