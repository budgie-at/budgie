import { RuleActionCreateInputSchema } from '../schema/rule-action-create-input.schema';

import type { z } from 'zod';

export type RuleActionCreateInputInterface = z.infer<typeof RuleActionCreateInputSchema>;
