import { RuleActionTypeEnum, RuleConditionMatchTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

import { selectSuggestCondition } from './select-suggest-condition.util';

export const buildRuleCreateInput = (suggestRuleData: SuggestRuleDataInterface): RuleCreateInputInterface | null => {
    const condition = selectSuggestCondition(suggestRuleData.title, suggestRuleData.mccCode, suggestRuleData.comment);

    if (!isDefined(condition)) {
        return null;
    }

    const categoryAction = isDefined(suggestRuleData.categoryId)
        ? [{ type: RuleActionTypeEnum.SET_CATEGORY as const, categoryId: suggestRuleData.categoryId, tagId: null, accountId: null }]
        : [];

    const tagActions = suggestRuleData.tagIds.map(tagId => ({
        type: RuleActionTypeEnum.ADD_TAG as const,
        categoryId: null,
        tagId,
        accountId: null
    }));

    return {
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions: [condition],
        actions: [...categoryAction, ...tagActions],
        applyToExisting: false
    };
};
