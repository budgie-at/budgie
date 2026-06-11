import { TransactionFilterInterface } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export const checkIfFiltersSelected = (accountId: number | null, filters: TransactionFilterInterface): boolean => {
    const { date, categoryIds, tagIds, types, accountIds } = filters;

    if (isNotEmptyArray(tagIds) || isNotEmptyArray(categoryIds) || isNotEmptyArray(types) || isDefined(date)) {
        return true;
    }

    return isNotEmptyArray(accountIds?.filter(id => id !== accountId));
};
