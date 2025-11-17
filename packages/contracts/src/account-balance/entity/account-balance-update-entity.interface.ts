import { infer } from 'zod';

import { AccountBalanceUpdateEntitySchema } from '../schema/account-balance-update-entity.schema';

export interface AccountBalanceUpdateEntityInterface extends infer<typeof AccountBalanceUpdateEntitySchema> {}
