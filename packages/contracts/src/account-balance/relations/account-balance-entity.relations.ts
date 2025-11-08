import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { InstrumentEntityTable } from '../../instrument/table/instrument-entity.table';
import { AccountBalanceAssociationEnum } from '../enum/account-balance-association.enum';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

export const AccountBalanceEntityRelations = relations(AccountBalanceEntityTable, ({ one }) => ({
    [AccountBalanceAssociationEnum.PARENT_ACCOUNT]: one(AccountEntityTable, {
        fields: [AccountBalanceEntityTable.parentAccountId],
        references: [AccountEntityTable.id]
    }),
    [AccountBalanceAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [AccountBalanceEntityTable.accountId],
        references: [AccountEntityTable.id]
    }),
    [AccountBalanceAssociationEnum.INSTRUMENT]: one(InstrumentEntityTable, {
        fields: [AccountBalanceEntityTable.instrumentId],
        references: [InstrumentEntityTable.id]
    })
}));
