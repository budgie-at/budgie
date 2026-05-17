import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const getTransactionEntryLabel = (entry: TransactionEntryWithRelationsEntityInterface | undefined, unknownLabel: string): string => {
    if (isDefined(entry?.category?.title)) {
        return entry.category.title;
    }

    return unknownLabel;
};
