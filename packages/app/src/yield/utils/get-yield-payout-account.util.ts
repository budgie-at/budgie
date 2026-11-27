import { TransactionTypeEnum } from '@budgie/contracts';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getYieldPayoutAccount = (transaction: TransactionWithRelationsEntityInterface) =>
    transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccount : transaction.toAccount;
