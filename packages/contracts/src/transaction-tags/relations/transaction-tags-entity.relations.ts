import { relations } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsAssociationEnum } from '../enum/transaction-tags-association.enum';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export const TransactionTagsEntityRelations = relations(TransactionTagsEntityTable, ({ one }) => ({
    [TransactionTagsAssociationEnum.TRANSACTION]: one(TransactionEntityTable, {
        fields: [TransactionTagsEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    }),
    [TransactionTagsAssociationEnum.TAG]: one(TagEntityTable, {
        fields: [TransactionTagsEntityTable.tagId],
        references: [TagEntityTable.id]
    })
}));
