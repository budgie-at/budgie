import type { AccountCreateEntitySchema } from '../schema/account-create-entity.schema';
import type { infer } from 'zod';

export interface AccountCreateEntityInterface extends infer<typeof AccountCreateEntitySchema> {}
