import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const getTransactionEntryLabel = (entry: TransactionEntryWithRelationsEntityInterface | undefined, unknownLabel: string): string => {
    if (isDefined(entry?.category)) {
        return entry.category.title;
    }

    if (isDefined(entry?.mccCategory?.shortDescription)) {
        return entry.mccCategory.shortDescription;
    }

    return unknownLabel;
};
