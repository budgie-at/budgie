import { z } from 'zod';

import { AccountBalanceUpdateEntitySchema } from '../schema/account-balance-update-entity.schema';

export type AccountBalanceUpdateEntityInterface = z.infer<typeof AccountBalanceUpdateEntitySchema>;
