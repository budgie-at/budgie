import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetEntitySchema } from './budget-entity.schema';

export const BudgetCreateEntitySchema = convertToCreateEntitySchema(BudgetEntitySchema).partial({
    status: true,
    startDay: true,
    customStartDate: true,
    customEndDate: true,
    isTemplate: true,
    excludeTransfers: true,
    excludePending: true,
    alertThreshold80: true,
    alertThreshold100: true
});
