import { relations } from 'drizzle-orm';

import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { ExchangeRateAssociationEnum } from '../enum/exchange-rate-association.enum';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

export const ExchangeRateEntityRelations = relations(ExchangeRateEntityTable, ({ one }) => ({
    [ExchangeRateAssociationEnum.BASE_INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [ExchangeRateEntityTable.baseInstrumentId],
        references: [InstrumentEntityTable.id]
    }),
    [ExchangeRateAssociationEnum.QUOTED_INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [ExchangeRateEntityTable.quoteInstrumentId],
        references: [InstrumentEntityTable.id]
    })
}));
