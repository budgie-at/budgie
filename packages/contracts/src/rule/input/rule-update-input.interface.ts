import { infer } from 'zod';

import { RuleUpdateInputSchema } from '../schema/rule-update-input.schema';

export interface RuleUpdateInputInterface extends infer<typeof RuleUpdateInputSchema> {}
