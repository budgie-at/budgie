import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BudgetTemplateEntitySchema } from './budget-template-entity.schema';

export const BudgetTemplateCreateEntitySchema = convertToCreateEntitySchema(BudgetTemplateEntitySchema);
