import type { BudgetPeriodSnapshotEntitySchema } from '../schema/budget-period-snapshot-entity.schema';
import type { infer as zodInfer } from 'zod';

export interface BudgetPeriodSnapshotEntityInterface extends zodInfer<typeof BudgetPeriodSnapshotEntitySchema> {}
