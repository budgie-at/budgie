import type { RuleActionEntitySchema } from '../schema/rule-action-entity.schema';
import type { infer } from 'zod';

export interface RuleActionEntityInterface extends infer<typeof RuleActionEntitySchema> {}
