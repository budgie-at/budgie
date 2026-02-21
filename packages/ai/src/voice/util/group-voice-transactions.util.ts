import { isNotEmptyArray } from '@rnw-community/shared';

import { sumAmounts } from '../../@generic/util/sum-amounts.util';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { GroupedVoiceTransactionInterface } from '../interface/grouped-voice-transaction.interface';

export const groupVoiceTransactions = (
    transactions: AITransactionInterface[],
    originalText: string
): GroupedVoiceTransactionInterface | null => {
    if (!isNotEmptyArray(transactions)) {
        return null;
    }

    const totalAmount = sumAmounts(transactions);
    const aiContext = transactions.map(transaction => transaction.comment).join(', ');
    const [firstTransaction] = transactions;

    return {
        amount: totalAmount,
        currency: firstTransaction.currency,
        account: firstTransaction.account,
        comment: originalText,
        aiContext
    };
};
