import type { RuleConditionEntitySchema } from '../schema/rule-condition-entity.schema';
import type { z } from 'zod';

export type RuleConditionEntityInterface = z.infer<typeof RuleConditionEntitySchema>;
