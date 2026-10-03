import { defineRelationsPart } from 'drizzle-orm';

import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { ExchangeRateAssociationEnum } from '../enum/exchange-rate-association.enum';
import { ExchangeRateEntityTable } from '../table/exchange-rate-entity.table';

export const ExchangeRateEntityRelations = defineRelationsPart(
    {
        ExchangeRateEntityTable,
        InstrumentEntityTable
    },
    relation => ({
        ExchangeRateEntityTable: {
            [ExchangeRateAssociationEnum.BASE_INSTRUMENT]: relation.one.InstrumentEntityTable({
                from: relation.ExchangeRateEntityTable.baseInstrumentId,
                to: relation.InstrumentEntityTable.id,
                optional: false
            }),
            [ExchangeRateAssociationEnum.QUOTED_INSTRUMENT]: relation.one.InstrumentEntityTable({
                from: relation.ExchangeRateEntityTable.quoteInstrumentId,
                to: relation.InstrumentEntityTable.id,
                optional: false
            })
        }
    })
);
