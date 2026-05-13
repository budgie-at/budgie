import { RuleUpdateInputSchema } from '../schema/rule-update-input.schema';

import type { z } from 'zod';

export type RuleUpdateInputInterface = z.infer<typeof RuleUpdateInputSchema>;
