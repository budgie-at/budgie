import { ExternalSourceEnum } from '@budgie/contracts';
import { extractEnableBankingCardMerchant } from '@budgie/sync';

import { isNotEmptyString } from '@rnw-community/shared';

import { getTransactionDisplayTitle } from './get-transaction-display-title.util';

import type { TransactionCreateInputInterface } from '@budgie/contracts';

export const getEnableBankingTransactionDisplayTitle = (
    transaction: Pick<TransactionCreateInputInterface, 'externalSource' | 'title' | 'comment'>
): string => {
    const title = getTransactionDisplayTitle(transaction);
    const parsedMerchant =
        transaction.externalSource === ExternalSourceEnum.ENABLE_BANKING && title === transaction.comment
            ? extractEnableBankingCardMerchant(transaction.comment)
            : null;

    return isNotEmptyString(parsedMerchant) ? parsedMerchant : title;
};
