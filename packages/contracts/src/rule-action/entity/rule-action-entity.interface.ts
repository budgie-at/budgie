import type { RuleActionEntitySchema } from '../schema/rule-action-entity.schema';
import type { z } from 'zod';

export type RuleActionEntityInterface = z.infer<typeof RuleActionEntitySchema>;
