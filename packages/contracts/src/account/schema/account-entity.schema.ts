import { createSelectSchema } from 'drizzle-zod';

import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable);
