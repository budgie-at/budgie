import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntityRelations = relations(TransactionEntityTable, ({ many, one }) => ({
    [TransactionAssociationEnum.ENTRIES]: many(TransactionEntryEntityTable),
    [TransactionAssociationEnum.FROM_ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntityTable.fromAccountId],
        references: [AccountEntityTable.id]
    }),
    [TransactionAssociationEnum.TO_ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntityTable.toAccountId],
        references: [AccountEntityTable.id]
    }),
    [TransactionAssociationEnum.TRANSACTION_TAGS]: many(TransactionTagsEntityTable)
}));
