import { z } from 'zod';

import { AccountBalanceCreateEntitySchema } from '../schema/account-balance-create-entity.schema';

export type AccountBalanceCreateEntityInterface = z.infer<typeof AccountBalanceCreateEntitySchema>;
