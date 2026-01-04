import {
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';

export const buildRuleInputFromPrefill = (prefillData: RulePrefillDataInterface): RuleCreateInputInterface => {
    const actions: RuleCreateInputInterface['actions'] = [];

    if (isDefined(prefillData.categoryId)) {
        actions.push({
            type: RuleActionTypeEnum.SET_CATEGORY,
            categoryId: prefillData.categoryId,
            tagId: null
        });
    }

    prefillData.tagIds.forEach(tagId => {
        actions.push({
            type: RuleActionTypeEnum.ADD_TAG,
            categoryId: null,
            tagId
        });
    });

    if (actions.length === 0) {
        actions.push({
            type: RuleActionTypeEnum.SET_CATEGORY,
            categoryId: null,
            tagId: null
        });
    }

    const conditions: RuleCreateInputInterface['conditions'] = prefillData.conditions.map(condition => ({
        field: condition.field,
        operator: RuleConditionOperatorEnum.CONTAINS,
        value: condition.value,
        secondaryValue: null
    }));

    const title = isNotEmptyArray(prefillData.conditions) ? prefillData.conditions[0].value.slice(0, 50) : '';

    return {
        title,
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions,
        actions
    };
};
