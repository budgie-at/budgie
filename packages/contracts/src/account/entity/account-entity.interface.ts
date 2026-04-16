import { z } from 'zod';

import { AccountEntitySchema } from '../schema/account-entity.schema';

export type AccountEntityInterface = z.infer<typeof AccountEntitySchema>;
