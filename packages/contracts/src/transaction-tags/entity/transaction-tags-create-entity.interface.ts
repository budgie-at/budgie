import { z } from 'zod';

import type { TransactionTagsCreateEntitySchema } from '../schema/transaction-tags-create-entity.schema';

export type TransactionTagsCreateEntityInterface = z.infer<typeof TransactionTagsCreateEntitySchema>;
