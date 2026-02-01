import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

export const isExternalTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    isNotEmptyString(transaction.externalId) && isNotEmptyString(transaction.externalSource);
