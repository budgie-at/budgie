import { infer } from 'zod';

import { RuleConditionCreateInputSchema } from '../schema/rule-condition-create-input.schema';

export interface RuleConditionCreateInputInterface extends infer<typeof RuleConditionCreateInputSchema> {}
