import type { AccountEntitySchema } from '../schema/account-entity.schema';
import type { infer } from 'zod';

export interface AccountEntityInterface extends infer<typeof AccountEntitySchema> {}
