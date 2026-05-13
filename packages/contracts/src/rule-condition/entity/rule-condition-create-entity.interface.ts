import type { RuleConditionCreateEntitySchema } from '../schema/rule-condition-create-entity.schema';
import type { z } from 'zod';

export type RuleConditionCreateEntityInterface = z.infer<typeof RuleConditionCreateEntitySchema>;
