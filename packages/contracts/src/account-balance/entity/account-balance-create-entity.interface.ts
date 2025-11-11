import { infer } from 'zod';

import { AccountBalanceCreateEntitySchema } from '../schema/account-balance-create-entity.schema';

export interface AccountBalanceCreateEntityInterface extends infer<typeof AccountBalanceCreateEntitySchema> {}
