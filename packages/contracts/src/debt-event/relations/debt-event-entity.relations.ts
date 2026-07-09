import { relations } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { DebtEventAssociationEnum } from '../enum/debt-event-association.enum';
import { DebtEventEntityTable } from '../table/debt-event-entity.table';

export const DebtEventEntityRelations = relations(DebtEventEntityTable, ({ one }) => ({
    [DebtEventAssociationEnum.DEBT_ACCOUNT]: one(AccountEntityTable, {
        fields: [DebtEventEntityTable.debtAccountId],
        references: [AccountEntityTable.id]
    }),
    [DebtEventAssociationEnum.TRANSACTION]: one(TransactionEntityTable, {
        fields: [DebtEventEntityTable.transactionId],
        references: [TransactionEntityTable.id]
    }),
    [DebtEventAssociationEnum.TRANSACTION_ENTRY]: one(TransactionEntryEntityTable, {
        fields: [DebtEventEntityTable.transactionEntryId],
        references: [TransactionEntryEntityTable.id]
    })
}));
