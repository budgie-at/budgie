import type { RuleAssociationEnum, RuleWithActionsRelationsEntityInterface } from '@budgie/contracts';

const getTriggerKey = (rule: Pick<RuleWithActionsRelationsEntityInterface, 'conditionMatchType' | RuleAssociationEnum.CONDITIONS>) =>
    [
        rule.conditionMatchType,
        ...rule.conditions
            .map(condition =>
                [condition.field, condition.operator, condition.value.trim().toLowerCase(), condition.secondaryValue ?? ''].join(':')
            )
            .sort((left, right) => left.localeCompare(right))
    ].join('|');

export const getOverlappingRuleIds = (
    rules: readonly Pick<
        RuleWithActionsRelationsEntityInterface,
        'id' | 'enabled' | 'conditionMatchType' | RuleAssociationEnum.CONDITIONS
    >[]
): ReadonlySet<number> => {
    const seenTriggerKeys = new Set<string>();
    const overlappingRuleIds = new Set<number>();

    for (const rule of rules.filter(({ enabled }) => enabled)) {
        const triggerKey = getTriggerKey(rule);

        if (seenTriggerKeys.has(triggerKey)) {
            overlappingRuleIds.add(rule.id);
        }

        seenTriggerKeys.add(triggerKey);
    }

    return overlappingRuleIds;
};
