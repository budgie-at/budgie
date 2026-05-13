import type { RuleCreateEntitySchema } from '../schema/rule-create-entity.schema';
import type { z } from 'zod';

export type RuleCreateEntityInterface = z.infer<typeof RuleCreateEntitySchema>;
