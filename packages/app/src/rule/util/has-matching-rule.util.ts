import {
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface
} from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { evaluateRuleCondition } from './evaluate-rule-condition.util';

const doesRuleMatchTransaction = (rule: RuleWithRelationsEntityInterface, transactionInput: TransactionCreateInputInterface): boolean => {
    if (!isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

    return rule.conditions[evaluator](condition => evaluateRuleCondition(condition, transactionInput));
};

const doesRuleApplySameOutcome = (rule: RuleWithRelationsEntityInterface, suggestRuleData: SuggestRuleDataInterface): boolean => {
    const setCategoryAction = rule.actions.find(action => action.type === RuleActionTypeEnum.SET_CATEGORY);
    const addTagActions = rule.actions.filter(action => action.type === RuleActionTypeEnum.ADD_TAG);

    const categoryMatches = setCategoryAction?.categoryId === suggestRuleData.categoryId;
    const ruleTagIds = addTagActions.map(action => action.tagId).filter((id): id is number => id !== null);
    const tagsMatch =
        ruleTagIds.length === suggestRuleData.tagIds.length && suggestRuleData.tagIds.every(tagId => ruleTagIds.includes(tagId));

    return categoryMatches && tagsMatch;
};

export const hasMatchingRule = (
    rules: RuleWithRelationsEntityInterface[],
    transactionInput: TransactionCreateInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => rules.some(rule => doesRuleMatchTransaction(rule, transactionInput) && doesRuleApplySameOutcome(rule, suggestRuleData));
