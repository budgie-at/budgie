import { TransactionTypeEnum } from '@budgie/contracts';

import { useGetEnabledRulesQuery } from '../../rule/query/use-get-enabled-rules.query';
import { doesRuleMatchTransaction } from '../../rule/util/does-rule-match-transaction.util';
import { convertTransactionToInput } from '../utils/convert-transaction-to-input.util';
import { getTransactionDisplayTitle } from '../utils/get-transaction-display-title.util';

import type { SuggestRuleDataInterface } from '../../rule/interface/suggest-rule-data.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

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
