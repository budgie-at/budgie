import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { RefundedSummaryKindEnum } from '../enum/refunded-summary-kind.enum';

import { sumEntryAmounts } from './sum-entry-amounts.util';

import type { RefundedSummaryInterface } from '../interface/refunded-summary.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const computeRefundedSummary = (
    transaction: TransactionWithRelationsEntityInterface,
    refundsTotal: number | null = null
): RefundedSummaryInterface | null => {
    if (transaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) {
        return null;
    }

    const credits = sumEntryAmounts(transaction.entries.filter(entry => entry.type === TransactionEntryTypeEnum.CREDIT));
    const debits = isDefined(refundsTotal)
        ? refundsTotal
        : sumEntryAmounts(transaction.entries.filter(entry => entry.type === TransactionEntryTypeEnum.DEBIT));

    return {
        kind: credits === debits ? RefundedSummaryKindEnum.FULL : RefundedSummaryKindEnum.PARTIAL,
        refundsTotal: debits
    };
};
