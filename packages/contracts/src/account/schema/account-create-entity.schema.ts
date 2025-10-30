import { createInsertSchema } from 'drizzle-zod';

import { AccountEntityTable } from '../table/account-entity.table';

export const AccountCreateEntitySchema = createInsertSchema(AccountEntityTable);
