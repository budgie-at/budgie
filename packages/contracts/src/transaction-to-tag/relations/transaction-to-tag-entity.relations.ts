import { relations } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionToTagAssociationEnum } from '../enum/transaction-to-tag-association.enum';
import { TransactionToTagEntityTable } from '../table/transaction-to-tag-entity.table';

export const TransactionToTagEntityRelations = relations(TransactionToTagEntityTable, ({ one }) => ({
    [TransactionToTagAssociationEnum.TRANSACTION]: one(TransactionEntityTable, {
        fields: [TransactionToTagEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    }),
    [TransactionToTagAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [TransactionToTagEntityTable.tagId],
        references: [TagEntityTable.id]
    })
}));
