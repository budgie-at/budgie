import type { AccountCreateEntitySchema } from '../schema/account-create-entity.schema';
import type { z } from 'zod';

export interface AccountCreateEntityInterface extends z.infer<typeof AccountCreateEntitySchema> {}
