import type { BudgetPeriodSnapshotCreateEntitySchema } from '../schema/budget-period-snapshot-create-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetPeriodSnapshotCreateEntityInterface extends zodInfer<typeof BudgetPeriodSnapshotCreateEntitySchema> {}
