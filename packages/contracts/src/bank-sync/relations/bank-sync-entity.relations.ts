import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { BankSyncAssociationEnum } from '../enum/bank-sync-association.enum';
import { BankSyncEntityTable } from '../table/bank-sync-entity.table';

export const BankSyncEntityRelations = relations(BankSyncEntityTable, ({ one }) => ({
    [BankSyncAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [BankSyncEntityTable.accountId],
        references: [AccountEntityTable.id]
    })
}));
