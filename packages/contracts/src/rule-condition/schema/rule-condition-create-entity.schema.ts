import { RuleConditionEntitySchema } from './rule-condition-entity.schema';

export const RuleConditionCreateEntitySchema = RuleConditionEntitySchema.pick({
    ruleId: true,
    field: true,
    operator: true,
    value: true,
    secondaryValue: true
});
