import { createSelectSchema } from 'drizzle-zod';

import { AccountBudgetExclusionEntityTable } from '../table/account-budget-exclusion-entity.table';

export const AccountBudgetExclusionEntitySchema = createSelectSchema(AccountBudgetExclusionEntityTable);
