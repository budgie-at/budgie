import { infer } from 'zod';

import { RuleCreateInputSchema } from '../schema/rule-create-input.schema';

export interface RuleCreateInputInterface extends infer<typeof RuleCreateInputSchema> {}
