import { relations } from 'drizzle-orm';

import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = relations(BudgetEntityTable, ({ many, one }) => ({
    categoryLimits: many(BudgetCategoryLimitEntityTable),
    instrument: one(InstrumentEntityTable, {
        fields: [BudgetEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    })
}));
