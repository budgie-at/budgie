import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetAllocationEntitySchema } from './budget-allocation-entity.schema';

export const BudgetAllocationCreateEntitySchema = convertToCreateEntitySchema(BudgetAllocationEntitySchema).partial({
    categoryId: true,
    allocationType: true,
    amount: true,
    percentage: true,
    rolloverRule: true,
    rolloverCap: true,
    isSinkingFund: true,
    sinkingFundTarget: true,
    sinkingFundTargetDate: true,
    isExcluded: true
});

