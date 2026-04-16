import { z } from 'zod';

import { AccountBalanceEntitySchema } from '../schema/account-balance-entity.schema';

export type AccountBalanceEntityInterface = z.infer<typeof AccountBalanceEntitySchema>;
