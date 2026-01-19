import { createSelectSchema } from 'drizzle-zod';

import { BudgetPeriodSnapshotEntityTable } from '../table/budget-period-snapshot-entity.table';

export const BudgetPeriodSnapshotEntitySchema = createSelectSchema(BudgetPeriodSnapshotEntityTable);
