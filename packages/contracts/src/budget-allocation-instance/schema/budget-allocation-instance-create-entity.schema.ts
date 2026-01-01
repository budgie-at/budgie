import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetAllocationInstanceEntitySchema } from './budget-allocation-instance-entity.schema';

export const BudgetAllocationInstanceCreateEntitySchema = convertToCreateEntitySchema(BudgetAllocationInstanceEntitySchema).partial({
    categoryId: true,
    planned: true,
    actual: true,
    forecast: true,
    rolloverIn: true,
    rolloverOut: true,
    adjustment: true
});

