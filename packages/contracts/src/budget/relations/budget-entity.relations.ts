import { relations } from 'drizzle-orm';

import { BudgetAllocationEntityTable } from '../../budget-allocation/table/budget-allocation-entity.table';
import { BudgetInstanceEntityTable } from '../../budget-instance/table/budget-instance-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { BudgetAssociationEnum } from '../enum/budget-association.enum';
import { BudgetEntityTable } from '../table/budget-entity.table';

export const BudgetEntityRelations = relations(BudgetEntityTable, ({ one, many }) => ({
    [BudgetAssociationEnum.INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [BudgetEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    }),
    [BudgetAssociationEnum.ALLOCATIONS]: many(BudgetAllocationEntityTable),
    [BudgetAssociationEnum.INSTANCES]: many(BudgetInstanceEntityTable)
}));
