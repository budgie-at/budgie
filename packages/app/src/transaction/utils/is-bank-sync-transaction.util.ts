import { ExternalSourceEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

export const isBankSyncTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean => (
        transaction.externalSource !== ExternalSourceEnum.MANUAL &&
        transaction.externalSource !== ExternalSourceEnum.CSV &&
        isDefined(transaction.externalId)
    );
