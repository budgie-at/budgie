import { defineRelationsPart } from 'drizzle-orm';

import { BudgetCategoryLimitEntityTable } from '../../budget-category-limit/table/budget-category-limit-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = defineRelationsPart(
    {
        BudgetCategoryLimitEntityTable,
        BudgetEntityTable,
        InstrumentEntityTable
    },
    relation => ({
        BudgetEntityTable: {
            categoryLimits: relation.many.BudgetCategoryLimitEntityTable({
                from: relation.BudgetEntityTable.id,
                to: relation.BudgetCategoryLimitEntityTable.budgetId
            }),
            instrument: relation.one.InstrumentEntityTable({
                from: relation.BudgetEntityTable.instrumentId,
                to: relation.InstrumentEntityTable.id,
                optional: false
            })
        }
    })
);
