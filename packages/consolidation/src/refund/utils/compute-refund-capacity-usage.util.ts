import { REFUND_TITLE_PREFIXES, TransactionEntryTypeEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { ComputeRefundCapacityUsageInputInterface } from '../interface/compute-refund-capacity-usage-input.interface';
import type { RefundCapacityUsageInterface } from '../interface/refund-capacity-usage.interface';

const UPPER_REJECTED_PAYMENT_FEE_PREFIXES = REFUND_TITLE_PREFIXES.rejectedPaymentFee.map(prefix => prefix.toUpperCase());

const matchesRejectedFeeTitle = (title: string): boolean => {
    const normalizedTitle = title.trim().toUpperCase();

    return UPPER_REJECTED_PAYMENT_FEE_PREFIXES.some(prefix => normalizedTitle.startsWith(prefix));
};

const sumAmounts = (amounts: readonly number[]): number => amounts.reduce((total, amount) => total + amount, 0);

export const computeRefundCapacityUsage = ({
    expenseEntries,
    expenseAccountId,
    absorbedEntries,
    absorbedSourceById,
    incomingTitle
}: ComputeRefundCapacityUsageInputInterface): RefundCapacityUsageInterface => {
    const liveFeeAmounts = expenseEntries
        .filter(
            entry =>
                entry.type === TransactionEntryTypeEnum.FEE &&
                entry.accountId === expenseAccountId &&
                !isDefined(entry.originalTransactionId) &&
                isPositiveNumber(entry.amount)
        )
        .map(entry => entry.amount);
    const absorbedFeeAmounts = absorbedEntries
        .filter(entry => matchesRejectedFeeTitle(absorbedSourceById.get(entry.originalTransactionId ?? 0)?.title ?? ''))
        .map(entry => entry.amount);
    const feeAmount = sumAmounts(liveFeeAmounts);
    const absorbedFeeTotal = Math.min(sumAmounts(absorbedFeeAmounts), feeAmount);
    const absorbedPrincipalTotal = sumAmounts(absorbedEntries.map(entry => entry.amount)) - absorbedFeeTotal;

    return {
        feeAmount,
        liveFeeAmounts,
        absorbedFeeAmounts,
        absorbedFeeTotal,
        absorbedPrincipalTotal,
        isRejectedFeeTitle: matchesRejectedFeeTitle(incomingTitle)
    };
};
