import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import type { RefundedSummaryInterface } from '../interface/refunded-summary.interface';
import type { TransactionEntityInterface } from '@budgie/contracts';

interface RefundedSummaryEntryInput {
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
}

interface RefundedSummaryTransactionInput {
    readonly consolidationType: TransactionEntityInterface['consolidationType'];
    readonly entries: readonly RefundedSummaryEntryInput[];
}

const sumEntries = (entries: readonly RefundedSummaryEntryInput[], type: TransactionEntryTypeEnum): number =>
    entries.filter(entry => entry.type === type).reduce((total, entry) => total + entry.amount, 0);

export const computeRefundedSummary = (transaction: RefundedSummaryTransactionInput): RefundedSummaryInterface | null => {
    if (transaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) {
        return null;
    }

    const credits = sumEntries(transaction.entries, TransactionEntryTypeEnum.CREDIT);
    const debits = sumEntries(transaction.entries, TransactionEntryTypeEnum.DEBIT);

    return {
        kind: credits === debits ? 'full' : 'partial',
        refundsTotal: debits
    };
};
