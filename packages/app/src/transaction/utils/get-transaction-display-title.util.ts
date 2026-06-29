import { isNotEmptyString } from '@rnw-community/shared';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const getTransactionDisplayTitle = (transaction: Pick<TransactionCreateInputInterface, 'title' | 'comment'>): string =>
    isNotEmptyString(transaction.title) ? transaction.title : transaction.comment;
