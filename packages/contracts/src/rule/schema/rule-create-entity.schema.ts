import { RuleEntitySchema } from './rule-entity.schema';

export const RuleCreateEntitySchema = RuleEntitySchema.pick({
    title: true,
    enabled: true,
    conditionMatchType: true
});
