import { defineRelationsPart } from 'drizzle-orm';

import { BudgetPeriodCategorySnapshotEntityTable } from '../../budget-period-category-snapshot/table/budget-period-category-snapshot-entity.table';
import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetPeriodSnapshotEntityTable } from '../table/budget-period-snapshot-entity.table';

export const BudgetPeriodSnapshotEntityRelations = defineRelationsPart(
    {
        BudgetEntityTable,
        BudgetPeriodCategorySnapshotEntityTable,
        BudgetPeriodSnapshotEntityTable,
        CategoryEntityTable
    },
    relation => ({
        BudgetPeriodSnapshotEntityTable: {
            budget: relation.one.BudgetEntityTable({
                from: relation.BudgetPeriodSnapshotEntityTable.budgetId,
                to: relation.BudgetEntityTable.id,
                optional: false
            }),
            categories: relation.many.BudgetPeriodCategorySnapshotEntityTable({
                from: relation.BudgetPeriodSnapshotEntityTable.id,
                to: relation.BudgetPeriodCategorySnapshotEntityTable.snapshotId
            })
        },
        BudgetPeriodCategorySnapshotEntityTable: {
            snapshot: relation.one.BudgetPeriodSnapshotEntityTable({
                from: relation.BudgetPeriodCategorySnapshotEntityTable.snapshotId,
                to: relation.BudgetPeriodSnapshotEntityTable.id,
                optional: false
            }),
            category: relation.one.CategoryEntityTable({
                from: relation.BudgetPeriodCategorySnapshotEntityTable.categoryId,
                to: relation.CategoryEntityTable.id,
                optional: false
            })
        }
    })
);
