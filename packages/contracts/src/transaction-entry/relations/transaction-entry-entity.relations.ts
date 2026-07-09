import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntityRelations = relations(TransactionEntryEntityTable, ({ many, one }) => ({
    [TransactionEntryAssociationEnum.TRANSACTION]: one(TransactionEntityTable, {
        fields: [TransactionEntryEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    }),
    [TransactionEntryAssociationEnum.DEBT_EVENTS]: many(DebtEventEntityTable),
    [TransactionEntryAssociationEnum.ACCOUNT]: one(AccountEntityTable, {
        fields: [TransactionEntryEntityTable.accountId],
        references: [AccountEntityTable.id]
    }),
    [TransactionEntryAssociationEnum.CATEGORY]: one(CategoryEntityTable, {
        fields: [TransactionEntryEntityTable.categoryId],
        references: [CategoryEntityTable.id]
    }),
    [TransactionEntryAssociationEnum.MCC_CATEGORY]: one(MccCategoryEntityTable, {
        fields: [TransactionEntryEntityTable.mccCategoryId],
        references: [MccCategoryEntityTable.id]
    })
}));
