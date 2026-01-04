import { RuleEntitySchema } from './rule-entity.schema';

export const RuleCreateEntitySchema = RuleEntitySchema.pick({
    title: true,
    priority: true,
    enabled: true
});
