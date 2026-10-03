import { TransactionTypeEnum } from '@budgie/contracts';
import { doesRuleMatchTransaction } from '@budgie/rules';

import { useGetEnabledRulesQuery } from '../../rule/query/use-get-enabled-rules.query';
import { convertTransactionToInput } from '../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { SuggestRuleDataInterface } from '@budgie/rules';

export const useTransactionInfoMatchingRules = (transaction: TransactionWithRelationsEntityInterface): readonly number[] => {
    const { enabledRules } = useGetEnabledRulesQuery();
    const categoryId = transaction.entries.at(0)?.categoryId ?? null;
    const mccCode = transaction.entries.at(0)?.mccCategory?.mcc ?? null;
    const tagIds = transaction.transactionTags.map(({ tagId }) => tagId);

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return [];
    }

    const suggestRuleData: SuggestRuleDataInterface = {
        title: getTransactionDisplayTitle(transaction),
        comment: transaction.comment,
        mccCode,
        categoryId,
        tagIds
    };
    const transactionInput = convertTransactionToInput(transaction);
    const matchingRules = enabledRules.filter(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));

    return matchingRules.map(rule => rule.id);
};
