import type { RuleEntitySchema } from '../schema/rule-entity.schema';
import type { infer } from 'zod';

export interface RuleEntityInterface extends infer<typeof RuleEntitySchema> {}
