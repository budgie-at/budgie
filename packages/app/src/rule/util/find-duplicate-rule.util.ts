import { RuleConditionEntityInterface, RuleConditionMatchTypeEnum, RuleWithRelationsEntityInterface } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

type ConditionInput = Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value' | 'secondaryValue'>;

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

export const findDuplicateRule = (
    conditions: ConditionInput[],
    conditionMatchType: RuleConditionMatchTypeEnum,
    existingRules: RuleWithRelationsEntityInterface[]
): RuleWithRelationsEntityInterface | undefined =>
    existingRules.find(
        rule =>
            rule.conditionMatchType === conditionMatchType &&
            isNotEmptyArray(rule.conditions) &&
            areConditionsEqual(conditions, rule.conditions)
    );
