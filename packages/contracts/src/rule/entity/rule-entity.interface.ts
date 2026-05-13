import type { RuleEntitySchema } from '../schema/rule-entity.schema';
import type { z } from 'zod';

export type RuleEntityInterface = z.infer<typeof RuleEntitySchema>;
