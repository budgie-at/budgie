import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { ExchangeRateEntityTable } from '../../exchange-rate/table/exchange-rate-entity.table';
import { InstrumentAssociationEnum } from '../enum/instrument-association.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntityRelations = relations(InstrumentEntityTable, ({ many }) => ({
    [InstrumentAssociationEnum.EXCHANGE_RATES]: many(ExchangeRateEntityTable),
    [InstrumentAssociationEnum.ACCOUNTS]: many(AccountEntityTable)
}));
