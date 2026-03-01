import { RuleWithRelationsEntityInterface, TransactionCreateInputInterface } from '@budgie/contracts';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { doesRuleMatchTransaction } from './has-matching-rule.util';

export const findMatchingRule = (
    rules: RuleWithRelationsEntityInterface[],
    transactionInput: TransactionCreateInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): RuleWithRelationsEntityInterface | undefined => rules.find(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));
