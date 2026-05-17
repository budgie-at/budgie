import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { resolveCategoryTitle } from '../../category/utils/resolve-category-title.util';

import type { MessageDescriptor } from '@lingui/core';

export const getTransactionEntryLabel = (
    entry: TransactionEntryWithRelationsEntityInterface | undefined,
    unknownLabel: string,
    t: (descriptor: MessageDescriptor) => string
): string => {
    if (isDefined(entry?.category)) {
        return resolveCategoryTitle(entry.category, t);
    }

    if (isDefined(entry?.mccCategory?.shortDescription)) {
        return entry.mccCategory.shortDescription;
    }

    return unknownLabel;
};
