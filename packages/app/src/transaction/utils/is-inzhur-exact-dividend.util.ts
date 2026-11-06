import { INZHUR_OPERATION_EXTERNAL_ID_PREFIX } from '@budgie/sync';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const isInzhurExactDividend = (transaction: Pick<TransactionWithRelationsEntityInterface, 'externalId'>) =>
    isDefined(transaction.externalId) && transaction.externalId.startsWith(INZHUR_OPERATION_EXTERNAL_ID_PREFIX);
