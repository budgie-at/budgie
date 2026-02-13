import { RuleActionEntitySchema } from './rule-action-entity.schema';

export const RuleActionCreateEntitySchema = RuleActionEntitySchema.pick({
    ruleId: true,
    type: true,
    categoryId: true,
    tagId: true,
    accountId: true
});
