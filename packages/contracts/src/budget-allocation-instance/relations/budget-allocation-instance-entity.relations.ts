import { relations } from 'drizzle-orm';

import { BudgetAllocationEntityTable } from '../../budget-allocation/table/budget-allocation-entity.table';
import { BudgetInstanceEntityTable } from '../../budget-instance/table/budget-instance-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetAllocationInstanceAssociationEnum } from '../enum/budget-allocation-instance-association.enum';
import { BudgetAllocationInstanceEntityTable } from '../table/budget-allocation-instance-entity.table';

export const BudgetAllocationInstanceEntityRelations = relations(BudgetAllocationInstanceEntityTable, ({ one }) => ({
    [BudgetAllocationInstanceAssociationEnum.BUDGET_INSTANCE]: one(BudgetInstanceEntityTable, {
        fields: [BudgetAllocationInstanceEntityTable.budgetInstanceId],
        references: [BudgetInstanceEntityTable.id]
    }),
    [BudgetAllocationInstanceAssociationEnum.BUDGET_ALLOCATION]: one(BudgetAllocationEntityTable, {
        fields: [BudgetAllocationInstanceEntityTable.budgetAllocationId],
        references: [BudgetAllocationEntityTable.id]
    }),
    [BudgetAllocationInstanceAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [BudgetAllocationInstanceEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    })
}));
