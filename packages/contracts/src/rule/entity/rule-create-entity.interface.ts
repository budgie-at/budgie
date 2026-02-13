import type { RuleCreateEntitySchema } from '../schema/rule-create-entity.schema';
import type { infer } from 'zod';

export interface RuleCreateEntityInterface extends infer<typeof RuleCreateEntitySchema> {}
