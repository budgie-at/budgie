import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { AccountBalanceEntityTable } from '../../account-balance/table/account-balance-entity.table';
import { InstrumentAssociationEnum } from '../enum/instrument-association.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntityRelations = relations(InstrumentEntityTable, ({ many }) => ({
    [InstrumentAssociationEnum.ACCOUNT_BALANCES]: many(AccountBalanceEntityTable),
    [InstrumentAssociationEnum.ACCOUNTS]: many(AccountEntityTable)
}));
