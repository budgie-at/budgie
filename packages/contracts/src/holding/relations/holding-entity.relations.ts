import { relations } from 'drizzle-orm';

import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { HoldingAssociationEnum } from '../enum/holding-association.enum';
import { HoldingEntityTable } from '../table/holding-entity.table';

export const HoldingEntityRelations = relations(HoldingEntityTable, ({ one }) => ({
    [HoldingAssociationEnum.INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [HoldingEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    })
}));
