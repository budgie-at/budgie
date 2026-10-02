import type { RuleConditionEntityInterface } from './rule-condition-entity.interface';

export type RuleConditionCreateEntityInterface = Pick<
    RuleConditionEntityInterface,
    'ruleId' | 'field' | 'operator' | 'value' | 'secondaryValue'
>;
