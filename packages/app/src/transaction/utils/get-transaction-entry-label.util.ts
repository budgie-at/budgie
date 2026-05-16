import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const getTransactionEntryLabel = (
    entry: TransactionEntryWithRelationsEntityInterface | undefined,
    unknownLabel: string,
    resolvedCategoryTitle: string | null
): string => {
    if (isDefined(resolvedCategoryTitle)) {
        return resolvedCategoryTitle;
    }

    if (isDefined(entry?.mccCategory?.shortDescription)) {
        return entry.mccCategory.shortDescription;
    }

    return unknownLabel;
};
