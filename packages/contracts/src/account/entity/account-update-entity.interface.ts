import { z } from 'zod';

import type { AccountUpdateEntitySchema } from '../schema/account-update-entity.schema';

export type AccountUpdateEntityInterface = z.infer<typeof AccountUpdateEntitySchema>;
