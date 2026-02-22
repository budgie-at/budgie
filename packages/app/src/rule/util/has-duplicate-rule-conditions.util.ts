import { RuleConditionMatchTypeEnum, RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

interface ConditionInput {
    readonly field: string;
    readonly operator: string;
    readonly value: string;
    readonly secondaryValue: string | null;
}

const serializeCondition = (condition: ConditionInput): string =>
    `${condition.field}|${condition.operator}|${condition.value.toLowerCase()}|${condition.secondaryValue?.toLowerCase() ?? ''}`;

const areConditionsEqual = (inputConditions: ConditionInput[], existingConditions: ConditionInput[]): boolean => {
    if (inputConditions.length !== existingConditions.length) {
        return false;
    }

    const inputKeys = inputConditions.map(serializeCondition).sort();
    const existingKeys = existingConditions.map(serializeCondition).sort();

    return inputKeys.every((key, index) => key === existingKeys[index]);
};

export const hasDuplicateRuleConditions = (
    conditions: ConditionInput[],
    conditionMatchType: RuleConditionMatchTypeEnum,
    existingRules: RuleWithRelationsEntityInterface[]
): boolean =>
    existingRules.some(
        rule =>
            rule.conditionMatchType === conditionMatchType &&
            isNotEmptyArray(rule.conditions) &&
            areConditionsEqual(conditions, rule.conditions)
    );
