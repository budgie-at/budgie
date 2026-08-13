import { z } from 'zod';

import { DepositAccountCreateInputSchema } from '../schema/deposit-account-create-input.schema';

export type DepositAccountCreateInputInterface = z.infer<typeof DepositAccountCreateInputSchema>;
