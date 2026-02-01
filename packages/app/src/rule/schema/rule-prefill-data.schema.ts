import { RuleConditionFieldEnum } from '@budgie/contracts';
import { z } from 'zod';

const RulePrefillConditionSchema = z.object({
    field: z.enum(RuleConditionFieldEnum),
    value: z.string()
});

export const RulePrefillDataSchema = z.object({
    conditions: z.array(RulePrefillConditionSchema),
    categoryId: z.number().nullable(),
    tagIds: z.array(z.number()),
    applyToExisting: z.boolean()
});
