import { RuleActionTypeEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum, RuleCreateInputInterface } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { RulePrefillDataInterface } from '../interface/rule-prefill-data.interface';

export const buildRuleInputFromPrefill = (prefillData: RulePrefillDataInterface): RuleCreateInputInterface => {
    const actions: RuleCreateInputInterface['actions'] = [];

    if (isDefined(prefillData.categoryId)) {
        actions.push({
            type: RuleActionTypeEnum.SET_CATEGORY,
            categoryId: prefillData.categoryId,
            tagId: null,
            accountId: null
        });
    }

    prefillData.tagIds.forEach(tagId => {
        actions.push({
            type: RuleActionTypeEnum.ADD_TAG,
            categoryId: null,
            tagId,
            accountId: null
        });
    });

    const conditions: RuleCreateInputInterface['conditions'] = prefillData.conditions.map(condition => ({
        field: condition.field,
        operator: RuleConditionOperatorEnum.CONTAINS,
        value: condition.value,
        secondaryValue: null
    }));

    return {
        enabled: true,
        conditionMatchType: RuleConditionMatchTypeEnum.ALL,
        conditions,
        actions,
        applyToExisting: prefillData.applyToExisting
    };
};
