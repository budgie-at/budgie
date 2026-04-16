import { z } from 'zod';

import { LiabilityAccountCreateInputSchema } from '../schema/liability-account-create-input.schema';

export type LiabilityAccountCreateInputInterface = z.infer<typeof LiabilityAccountCreateInputSchema>;
