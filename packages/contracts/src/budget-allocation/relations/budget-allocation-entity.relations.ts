import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { BudgetAllocationInstanceEntityTable } from '../../budget-allocation-instance/table/budget-allocation-instance-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { BudgetAllocationAssociationEnum } from '../enum/budget-allocation-association.enum';
import { BudgetAllocationEntityTable } from '../table/budget-allocation-entity.table';

export const BudgetAllocationEntityRelations = relations(BudgetAllocationEntityTable, ({ one, many }) => ({
    [BudgetAllocationAssociationEnum.BUDGET]: one(BudgetEntityTable, {
        fields: [BudgetAllocationEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    [BudgetAllocationAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [BudgetAllocationEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [BudgetAllocationAssociationEnum.INSTANCE_ALLOCATIONS]: many(BudgetAllocationInstanceEntityTable)
}));

