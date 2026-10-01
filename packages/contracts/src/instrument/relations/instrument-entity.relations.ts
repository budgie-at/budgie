import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { InstrumentAssociationEnum } from '../enum/instrument-association.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        ExchangeRateEntityTable,
        InstrumentEntityTable
    },
    relation => ({
        InstrumentEntityTable: {
            [InstrumentAssociationEnum.EXCHANGE_RATES]: relation.many.ExchangeRateEntityTable({
                from: relation.InstrumentEntityTable.id,
                to: relation.ExchangeRateEntityTable.baseInstrumentId
            }),
            [InstrumentAssociationEnum.ACCOUNTS]: relation.many.AccountEntityTable({
                from: relation.InstrumentEntityTable.id,
                to: relation.AccountEntityTable.instrumentId
            })
        }
    })
);
