import type { RuleConditionEntitySchema } from '../schema/rule-condition-entity.schema';
import type { infer } from 'zod';

export interface RuleConditionEntityInterface extends infer<typeof RuleConditionEntitySchema> {}
