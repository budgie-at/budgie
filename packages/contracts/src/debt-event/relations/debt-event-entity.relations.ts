import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { DebtEventAssociationEnum } from '../enum/debt-event-association.enum';
import { DebtEventEntityTable } from '../table/debt-event-entity.table';

export const DebtEventEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        DebtEventEntityTable,
        TransactionEntityTable,
        TransactionEntryEntityTable
    },
    relation => ({
        DebtEventEntityTable: {
            [DebtEventAssociationEnum.DEBT_ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.DebtEventEntityTable.debtAccountId,
                to: relation.AccountEntityTable.id,
                optional: false
            }),
            [DebtEventAssociationEnum.TRANSACTION]: relation.one.TransactionEntityTable({
                from: relation.DebtEventEntityTable.transactionId,
                to: relation.TransactionEntityTable.id
            }),
            [DebtEventAssociationEnum.TRANSACTION_ENTRY]: relation.one.TransactionEntryEntityTable({
                from: relation.DebtEventEntityTable.transactionEntryId,
                to: relation.TransactionEntryEntityTable.id
            })
        }
    })
);
