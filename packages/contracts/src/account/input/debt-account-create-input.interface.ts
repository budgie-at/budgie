import { infer } from 'zod';

import { DebtAccountCreateInputSchema } from '../schema/debt-account-create-input.schema';

export interface DebtAccountCreateInputInterface extends infer<typeof DebtAccountCreateInputSchema> {}
