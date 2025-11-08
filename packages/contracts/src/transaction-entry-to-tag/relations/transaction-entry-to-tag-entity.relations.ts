import { relations } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryToTagAssociationEnum } from '../enum/transaction-entry-to-tag-association.enum';
import { TransactionEntryToTagEntityTable } from '../table/transaction-entry-to-tag-entity.table';

export const TransactionEntryToTagEntityRelations = relations(TransactionEntryToTagEntityTable, ({ one }) => ({
    [TransactionEntryToTagAssociationEnum.TRANSACTION_ENTRY]: one(TransactionEntityTable, {
        fields: [TransactionEntryToTagEntityTable.transactionEntryId],
        references: [TransactionEntityTable.id]
    }),
    [TransactionEntryToTagAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [TransactionEntryToTagEntityTable.tagId],
        references: [TagEntityTable.id]
    })
}));
