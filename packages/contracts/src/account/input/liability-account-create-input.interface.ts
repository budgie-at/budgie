import { infer } from 'zod';

import { LiabilityAccountCreateInputSchema } from '../schema/liability-account-create-input.schema';

export interface LiabilityAccountCreateInputInterface extends infer<typeof LiabilityAccountCreateInputSchema> {}
