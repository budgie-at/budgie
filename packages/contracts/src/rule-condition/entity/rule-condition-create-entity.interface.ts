import type { RuleConditionCreateEntitySchema } from '../schema/rule-condition-create-entity.schema';
import type { infer } from 'zod';

export interface RuleConditionCreateEntityInterface extends infer<typeof RuleConditionCreateEntitySchema> {}
