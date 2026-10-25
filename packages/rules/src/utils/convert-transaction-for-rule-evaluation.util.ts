import {
    TransactionAssociationEnum,
    TransactionEntryAssociationEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    convertFromMicroUnits
} from '@budgie/contracts';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';

const sumEntryAmountsOfType = (
    entries: TransactionWithEntriesMccCategoryEntityInterface['entries'],
    type: TransactionEntryTypeEnum
): number => entries.filter(entry => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0);

const calculateAmountForRuleEvaluation = (transaction: TransactionWithEntriesMccCategoryEntityInterface): number => {
    const entries = transaction[TransactionAssociationEnum.ENTRIES];

    switch (transaction.type) {
        case TransactionTypeEnum.EXPENSE:
        case TransactionTypeEnum.TRANSFER:
            return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
        case TransactionTypeEnum.INCOME:
            return sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT);
        case TransactionTypeEnum.ADJUSTMENT:
            return entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT)
                ? sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.DEBIT)
                : sumEntryAmountsOfType(entries, TransactionEntryTypeEnum.CREDIT);
        default:
            return 0;
    }
};

export const convertTransactionForRuleEvaluation = (
    transaction: TransactionWithEntriesMccCategoryEntityInterface
): RuleEvaluationInputInterface => {
    const entries = transaction[TransactionAssociationEnum.ENTRIES];

    return {
        ...transaction,
        amount: convertFromMicroUnits(calculateAmountForRuleEvaluation(transaction)),
        tagIds: [],
        entries: entries.map(entry => ({
            type: entry.type,
            categoryId: entry.categoryId,
            accountId: entry.accountId,
            amount: convertFromMicroUnits(entry.amount),
            mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null,
            mccCode: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.mcc ?? null
        }))
    };
};
