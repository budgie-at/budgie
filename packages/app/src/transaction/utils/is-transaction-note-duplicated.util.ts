import { isNotEmptyString } from '@rnw-community/shared';

import { getTransactionDisplayTitle } from './get-transaction-display-title.util';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const isTransactionNoteDuplicated = (transaction: Pick<TransactionCreateInputInterface, 'title' | 'comment'>): boolean =>
    isNotEmptyString(transaction.comment) && transaction.comment === getTransactionDisplayTitle(transaction);
