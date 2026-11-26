import { REFUND_TITLE_PREFIXES, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { ComputeRefundCapacityUsageInputInterface } from '../interface/compute-refund-capacity-usage-input.interface';
import type { RefundCapacityUsageInterface } from '../interface/refund-capacity-usage.interface';
import type { TransactionEntryEntityInterface } from '@budgie/contracts';

const UPPER_REJECTED_PAYMENT_FEE_PREFIXES = REFUND_TITLE_PREFIXES.rejectedPaymentFee.map(prefix => prefix.toUpperCase());

const matchesRejectedFeeTitle = (title: string): boolean => {
    const normalizedTitle = title.trim().toUpperCase();

    return UPPER_REJECTED_PAYMENT_FEE_PREFIXES.some(prefix => normalizedTitle.startsWith(prefix));
};

const sumEntryAmounts = (entries: readonly TransactionEntryEntityInterface[]): number =>
    entries.reduce((total, entry) => total + entry.amount, 0);

export const computeRefundCapacityUsage = ({
    expenseEntries,
    expenseAccountId,
    absorbedEntries,
    absorbedSourceById,
    incomingTitle
}: ComputeRefundCapacityUsageInputInterface): RefundCapacityUsageInterface => {
    const feeAmount = sumEntryAmounts(
        expenseEntries.filter(
            entry =>
                entry.type === TransactionEntryTypeEnum.FEE &&
                entry.accountId === expenseAccountId &&
                !isDefined(entry.originalTransactionId) &&
                isPositiveNumber(entry.amount)
        )
    );
    const rawAbsorbedFeeTotal = sumEntryAmounts(
        absorbedEntries.filter(entry => matchesRejectedFeeTitle(absorbedSourceById.get(entry.originalTransactionId ?? 0)?.title ?? ''))
    );
    const absorbedFeeTotal = Math.min(rawAbsorbedFeeTotal, feeAmount);
    const absorbedPrincipalTotal = sumEntryAmounts(absorbedEntries) - absorbedFeeTotal;

    return {
        feeAmount,
        absorbedFeeTotal,
        absorbedPrincipalTotal,
        isRejectedFeeTitle: matchesRejectedFeeTitle(incomingTitle)
    };
};
