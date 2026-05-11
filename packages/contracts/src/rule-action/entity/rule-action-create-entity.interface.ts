import type { RuleActionCreateEntitySchema } from '../schema/rule-action-create-entity.schema';
import type { z } from 'zod';

export type RuleActionCreateEntityInterface = z.infer<typeof RuleActionCreateEntitySchema>;
