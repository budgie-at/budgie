import { z } from 'zod';

import type { TransactionTagsEntitySchema } from '../schema/transaction-tags-entity.schema';

export type TransactionTagsEntityInterface = z.infer<typeof TransactionTagsEntitySchema>;
