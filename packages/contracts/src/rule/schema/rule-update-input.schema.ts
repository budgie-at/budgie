import { array } from 'zod';

import { RuleActionCreateInputSchema } from '../../rule-action/schema/rule-action-create-input.schema';
import { RuleConditionCreateInputSchema } from '../../rule-condition/schema/rule-condition-create-input.schema';

import { RuleUpdateEntitySchema } from './rule-update-entity.schema';

export const RuleUpdateInputSchema = RuleUpdateEntitySchema.extend({
    conditions: array(RuleConditionCreateInputSchema).optional(),
    actions: array(RuleActionCreateInputSchema).optional()
});
