import type { AccountUpdateEntitySchema } from '../schema/account-update-entity.schema';
import type { infer } from 'zod';

export interface AccountUpdateEntityInterface extends infer<typeof AccountUpdateEntitySchema> {}
