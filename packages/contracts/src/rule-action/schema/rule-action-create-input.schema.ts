import { RuleActionCreateEntitySchema } from './rule-action-create-entity.schema';

export const RuleActionCreateInputSchema = RuleActionCreateEntitySchema.omit({ ruleId: true });
