import { relations } from 'drizzle-orm';

import { BudgetTemplateEntityTable } from '../table/budget-template-entity.table';

export const BudgetTemplateEntityRelations = relations(BudgetTemplateEntityTable, () => ({}));
