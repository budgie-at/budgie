import { z } from 'zod';

import { DebtAccountCreateInputSchema } from '../schema/debt-account-create-input.schema';

export type DebtAccountCreateInputInterface = z.infer<typeof DebtAccountCreateInputSchema>;
