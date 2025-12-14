import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';
import hash from 'object-hash';

import { isDefined } from '@rnw-community/shared';

export const checkIfFiltersSelected = (accountId: number | null, filters: TransactionFilterInterface): boolean => {
    const defaultFilters = {
        ...DEFAULT_TRANSACTION_FILTER,
        accountIds: isDefined(accountId) ? [accountId] : null
    };

    return hash(defaultFilters) !== hash(filters);
};
