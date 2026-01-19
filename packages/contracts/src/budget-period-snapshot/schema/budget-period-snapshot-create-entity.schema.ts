import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetPeriodSnapshotEntitySchema } from './budget-period-snapshot-entity.schema';

export const BudgetPeriodSnapshotCreateEntitySchema = convertToCreateEntitySchema(BudgetPeriodSnapshotEntitySchema);
