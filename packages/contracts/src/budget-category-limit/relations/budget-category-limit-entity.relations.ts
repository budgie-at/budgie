import { defineRelationsPart } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetCategoryLimitEntityTable } from '../table/budget-category-limit-entity.table';

export const BudgetCategoryLimitEntityRelations = defineRelationsPart(
    {
        BudgetCategoryLimitEntityTable,
        BudgetEntityTable,
        CategoryEntityTable
    },
    relation => ({
        BudgetCategoryLimitEntityTable: {
            budget: relation.one.BudgetEntityTable({
                from: relation.BudgetCategoryLimitEntityTable.budgetId,
                to: relation.BudgetEntityTable.id,
                optional: false
            }),
            category: relation.one.CategoryEntityTable({
                from: relation.BudgetCategoryLimitEntityTable.categoryId,
                to: relation.CategoryEntityTable.id,
                optional: false
            })
        }
    })
);
