import type { RuleActionCreateEntitySchema } from '../schema/rule-action-create-entity.schema';
import type { infer } from 'zod';

export interface RuleActionCreateEntityInterface extends infer<typeof RuleActionCreateEntitySchema> {}
