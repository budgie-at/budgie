import type { RuleUpdateEntitySchema } from '../schema/rule-update-entity.schema';
import type { infer } from 'zod';

export interface RuleUpdateEntityInterface extends infer<typeof RuleUpdateEntitySchema> {}
