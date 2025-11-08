import { infer } from 'zod';

import { AccountBalanceEntitySchema } from '../schema/account-balance-entity.schema';

export interface AccountBalanceEntityInterface extends infer<typeof AccountBalanceEntitySchema> {}
