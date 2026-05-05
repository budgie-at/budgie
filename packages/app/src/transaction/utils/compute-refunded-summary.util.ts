import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { RefundedSummaryKindEnum } from '../enum/refunded-summary-kind.enum';

import type { RefundedSummaryInterface } from '../interface/refunded-summary.interface';
import type { TransactionEntryEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const sumEntries = (entries: readonly Pick<TransactionEntryEntityInterface, 'type' | 'amount'>[], type: TransactionEntryTypeEnum): number =>
    entries.filter(entry => entry.type === type).reduce((total, entry) => total + entry.amount, 0);

export const computeRefundedSummary = (transaction: TransactionWithRelationsEntityInterface): RefundedSummaryInterface | null => {
    if (transaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) {
        return null;
    }

    const credits = sumEntries(transaction.entries, TransactionEntryTypeEnum.CREDIT);
    const debits = sumEntries(transaction.entries, TransactionEntryTypeEnum.DEBIT);

    return {
        kind: credits === debits ? RefundedSummaryKindEnum.FULL : RefundedSummaryKindEnum.PARTIAL,
        refundsTotal: debits
    };
};
