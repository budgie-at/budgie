import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetInstanceEntitySchema } from './budget-instance-entity.schema';

export const BudgetInstanceCreateEntitySchema = convertToCreateEntitySchema(BudgetInstanceEntitySchema).partial({
    status: true,
    totalPlanned: true,
    totalActual: true,
    totalForecast: true,
    exchangeRate: true,
    incomeActual: true
});

