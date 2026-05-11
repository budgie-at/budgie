import type { RuleUpdateEntitySchema } from '../schema/rule-update-entity.schema';
import type { z } from 'zod';

export type RuleUpdateEntityInterface = z.infer<typeof RuleUpdateEntitySchema>;
