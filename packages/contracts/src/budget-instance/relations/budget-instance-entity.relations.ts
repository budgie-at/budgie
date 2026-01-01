import { relations } from 'drizzle-orm';

import { BudgetEntityTable } from '../../budget/table/budget-entity.table';
import { BudgetAllocationInstanceEntityTable } from '../../budget-allocation-instance/table/budget-allocation-instance-entity.table';
import { BudgetInstanceAssociationEnum } from '../enum/budget-instance-association.enum';
import { BudgetInstanceEntityTable } from '../table/budget-instance-entity.table';

export const BudgetInstanceEntityRelations = relations(BudgetInstanceEntityTable, ({ one, many }) => ({
    [BudgetInstanceAssociationEnum.BUDGET]: one(BudgetEntityTable, {
        fields: [BudgetInstanceEntityTable.budgetId],
        references: [BudgetEntityTable.id]
    }),
    [BudgetInstanceAssociationEnum.ALLOCATION_INSTANCES]: many(BudgetAllocationInstanceEntityTable)
}));

