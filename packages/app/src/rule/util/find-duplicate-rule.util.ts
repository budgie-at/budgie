import { RuleConditionMatchTypeEnum, RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { RuleConditionInputInterface } from '../interface/rule-condition-input.interface';

const serializeCondition = (condition: RuleConditionInputInterface): string =>
    `${condition.field}|${condition.operator}|${condition.value.toLowerCase()}|${condition.secondaryValue?.toLowerCase() ?? ''}`;

const areConditionsEqual = (inputConditions: RuleConditionInputInterface[], existingConditions: RuleConditionInputInterface[]): boolean => {
    if (inputConditions.length !== existingConditions.length) {
        return false;
    }

    const inputKeys = inputConditions.map(serializeCondition).sort();
    const existingKeys = existingConditions.map(serializeCondition).sort();

    return inputKeys.every((key, index) => key === existingKeys[index]);
};

export const findDuplicateRule = (
    conditions: RuleConditionInputInterface[],
    conditionMatchType: RuleConditionMatchTypeEnum,
    existingRules: RuleWithRelationsEntityInterface[]
): RuleWithRelationsEntityInterface | undefined =>
    existingRules.find(
        rule =>
            rule.conditionMatchType === conditionMatchType &&
            isNotEmptyArray(rule.conditions) &&
            areConditionsEqual(conditions, rule.conditions)
    );
