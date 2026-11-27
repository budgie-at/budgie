import { isNotEmptyString } from '@rnw-community/shared';

import { getEnableBankingTransactionDisplayTitle } from './get-enable-banking-transaction-display-title.util';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const isTransactionNoteDuplicated = (
    transaction: Pick<TransactionCreateInputInterface, 'externalSource' | 'title' | 'comment'>
): boolean => isNotEmptyString(transaction.comment) && transaction.comment === getEnableBankingTransactionDisplayTitle(transaction);
