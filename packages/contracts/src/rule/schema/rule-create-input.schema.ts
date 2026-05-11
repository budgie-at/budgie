import { array } from 'zod';

import { RuleActionCreateInputSchema } from '../../rule-action/schema/rule-action-create-input.schema';
import { RuleConditionCreateInputSchema } from '../../rule-condition/schema/rule-condition-create-input.schema';

import { RuleCreateEntitySchema } from './rule-create-entity.schema';

export const RuleCreateInputSchema = RuleCreateEntitySchema.extend({
    conditions: array(RuleConditionCreateInputSchema),
    actions: array(RuleActionCreateInputSchema)
});
