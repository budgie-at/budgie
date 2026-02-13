import { infer } from 'zod';

import { RuleActionCreateInputSchema } from '../schema/rule-action-create-input.schema';

export interface RuleActionCreateInputInterface extends infer<typeof RuleActionCreateInputSchema> {}
