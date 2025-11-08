import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntityRelations = relations(TransactionEntryEntityTable, ({ one }) => ({
    [TransactionEntryAssociationEnum.TRANSACTION]: one(TransactionEntityTable, {
        fields: [TransactionEntryEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    }),
    [TransactionEntryAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntryEntityTable.accountId],
        references: [AccountEntityTable.id]
    }),
    [TransactionEntryAssociationEnum.PARENT_ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntryEntityTable.parentAccountId],
        references: [AccountEntityTable.id]
    })
}));
