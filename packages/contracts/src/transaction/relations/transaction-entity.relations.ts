import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { TransactionToTagEntityTable } from '../../transaction-to-tag/table/transaction-to-tag-entity.table';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntityRelations = relations(TransactionEntityTable, ({ one, many }) => ({
    [TransactionAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntityTable.accountId],
        references: [AccountEntityTable.id]
    }),
    [TransactionAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [TransactionEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [TransactionAssociationEnum.TAGS]: many(TransactionToTagEntityTable)
}));
