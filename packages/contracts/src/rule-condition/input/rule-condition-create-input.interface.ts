import { RuleConditionCreateInputSchema } from '../schema/rule-condition-create-input.schema';

import type { z } from 'zod';

export type RuleConditionCreateInputInterface = z.infer<typeof RuleConditionCreateInputSchema>;
