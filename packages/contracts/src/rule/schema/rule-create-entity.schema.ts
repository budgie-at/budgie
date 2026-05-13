import { RuleEntitySchema } from './rule-entity.schema';

export const RuleCreateEntitySchema = RuleEntitySchema.pick({
    enabled: true,
    conditionMatchType: true
});
