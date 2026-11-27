import { TransactionAssociationEnum, TransactionEntryAssociationEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { calculateRuleEvaluationAmount } from './calculate-rule-evaluation-amount.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { TransactionWithEntriesMccCategoryEntityInterface } from '@budgie/contracts';

export const convertTransactionForRuleEvaluation = (
    transaction: TransactionWithEntriesMccCategoryEntityInterface
): RuleEvaluationInputInterface => {
    const entries = transaction[TransactionAssociationEnum.ENTRIES].map(entry => ({
        id: entry.id,
        sequence: entry.sequence,
        type: entry.type,
        categoryId: entry.categoryId,
        accountId: entry.accountId,
        amount: convertFromMicroUnits(entry.amount),
        mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null,
        mccCode: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.mcc ?? null
    }));

    return {
        ...transaction,
        title: isNotEmptyString(transaction.title) ? transaction.title : transaction.comment,
        amount: calculateRuleEvaluationAmount(transaction.type, entries, 0),
        tagIds: [],
        entries
    };
};
