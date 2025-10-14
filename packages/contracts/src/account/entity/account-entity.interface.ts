import { infer } from 'zod';
import { AccountEntitySchema } from '../schema/account-entity.schema';

export interface AccountEntityInterface extends infer<typeof AccountEntitySchema> {}
