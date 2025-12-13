import { DEFAULT_TRANSACTION_FILTER, TransactionFilterInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const checkIfFiltersSelected = (accountId: number | null, filters: TransactionFilterInterface) =>
    JSON.stringify({ ...DEFAULT_TRANSACTION_FILTER, accountIds: isDefined(accountId) ? [accountId] : null }) !== JSON.stringify(filters);
