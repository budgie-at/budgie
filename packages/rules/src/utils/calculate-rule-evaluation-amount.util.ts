import { TransactionEntryTypeEnum, TransactionTypeEnum, convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

const sumEntryAmountsOfType = (
    entries: readonly Pick<TransactionEntryCreateInputInterface, 'type' | 'amount'>[],
    type: TransactionEntryTypeEnum
): number => {
    let matchingCount = 0;
    let firstAmount = 0;
    let totalMicroUnits = 0;

    for (const entry of entries) {
        if (entry.type === type) {
            matchingCount += 1;
            if (matchingCount === 1) {
                firstAmount = entry.amount;
            }
            totalMicroUnits += convertToMicroUnits(entry.amount);
        }
    }

    if (matchingCount === 0) {
        return 0;
    }

    return matchingCount === 1 ? firstAmount : convertFromMicroUnits(totalMicroUnits);
};

export const calculateRuleEvaluationAmount = (
    type: TransactionTypeEnum,
    entries: readonly Pick<TransactionEntryCreateInputInterface, 'type' | 'amount'>[],
    fallbackAmount: number
): number => {
    if (!isNotEmptyArray(entries)) {
        return type === TransactionTypeEnum.DEBT ? 0 : fallbackAmount;
    }

    switch (type) {
        case TransactionTypeEnum.EXPENSE:
        case TransactionTypeEnum.TRANSFER:
            return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
        case TransactionTypeEnum.INCOME:
            return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT);
        case TransactionTypeEnum.ADJUSTMENT:
            return entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                ? sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT)
                : sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
        case TransactionTypeEnum.DEBT:
        default:
            return 0;
    }
};
