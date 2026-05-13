import { RuleCreateInputSchema } from '../schema/rule-create-input.schema';

import type { z } from 'zod';

export type RuleCreateInputInterface = z.infer<typeof RuleCreateInputSchema>;
