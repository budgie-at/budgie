import { z } from 'zod';

import type { AccountCreateEntitySchema } from '../schema/account-create-entity.schema';

export type AccountCreateEntityInterface = z.infer<typeof AccountCreateEntitySchema>;
