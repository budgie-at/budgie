import { RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { doesRuleMatchTransaction } from './has-matching-rule.util';

export const findMatchingRule = (
    rules: RuleWithRelationsEntityInterface[],
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): RuleWithRelationsEntityInterface | undefined => rules.find(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));
