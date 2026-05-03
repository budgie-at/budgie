import { AITransactionInterface } from '@budgie/ai';

import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';

export const mapExtractedToReviewRows = (transactions: AITransactionInterface[]): VoiceReviewRowInterface[] =>
    transactions.map((transaction, index) => ({
        id: `voice-row-${Date.now()}-${index}`,
        amountMicroUnits: convertToMicroUnits(transaction.amount),
        currency: transaction.currency,
        description: transaction.comment,
        accountId: transaction.account?.id ?? null
    }));
