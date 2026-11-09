import { TransactionTypeEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';

import { convertTransactionToInput } from './convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from './get-transaction-display-title.util';

import type { RuleWithRelationsEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const findTransactionMatchingRuleIds = (
    enabledRules: readonly RuleWithRelationsEntityInterface[],
    transaction: TransactionWithRelationsEntityInterface
): number[] => {
    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return [];
    }

    const firstEntry = transaction.entries.at(0);
    const transactionInput = convertTransactionToInput(transaction);
    const suggestRuleData = {
        title: getTransactionDisplayTitle(transaction),
        comment: transaction.comment,
        mccCode: firstEntry?.mccCategory?.mcc ?? null,
        categoryId: firstEntry?.categoryId ?? null,
        tagIds: transaction.transactionTags.map(({ tagId }) => tagId)
    };

    return enabledRules.filter(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData)).map(rule => rule.id);
};
