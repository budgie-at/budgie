import type { AccountEntitySchema } from '../schema/account-entity.schema';
import type { z } from 'zod';

export interface AccountEntityInterface extends z.infer<typeof AccountEntitySchema> {}
