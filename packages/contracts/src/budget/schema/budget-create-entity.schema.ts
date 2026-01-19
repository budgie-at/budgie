import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetEntitySchema } from './budget-entity.schema';

export const BudgetCreateEntitySchema = convertToCreateEntitySchema(BudgetEntitySchema);
