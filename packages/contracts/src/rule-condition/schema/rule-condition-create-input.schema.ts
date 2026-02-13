import { RuleConditionCreateEntitySchema } from './rule-condition-create-entity.schema';

export const RuleConditionCreateInputSchema = RuleConditionCreateEntitySchema.omit({ ruleId: true });
