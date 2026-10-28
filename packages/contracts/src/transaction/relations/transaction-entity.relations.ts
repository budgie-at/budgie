import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionReceiptEntityTable } from '../../transaction-receipt/table/transaction-receipt-entity.table';
import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionEntityTable } from '../table/transaction-entity.table';

export const TransactionEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        DebtEventEntityTable,
        TransactionEntityTable,
        TransactionEntryEntityTable,
        TransactionReceiptEntityTable,
        TransactionTagsEntityTable
    },
    relation => ({
        TransactionEntityTable: {
            [TransactionAssociationEnum.ENTRIES]: relation.many.TransactionEntryEntityTable({
                from: relation.TransactionEntityTable.id,
                to: relation.TransactionEntryEntityTable.transactionId
            }),
            [TransactionAssociationEnum.DEBT_EVENTS]: relation.many.DebtEventEntityTable({
                from: relation.TransactionEntityTable.id,
                to: relation.DebtEventEntityTable.transactionId
            }),
            [TransactionAssociationEnum.FROM_ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.TransactionEntityTable.fromAccountId,
                to: relation.AccountEntityTable.id
            }),
            [TransactionAssociationEnum.TO_ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.TransactionEntityTable.toAccountId,
                to: relation.AccountEntityTable.id
            }),
            [TransactionAssociationEnum.RECEIPT]: relation.one.TransactionReceiptEntityTable({
                from: relation.TransactionEntityTable.id,
                to: relation.TransactionReceiptEntityTable.transactionId
            }),
            [TransactionAssociationEnum.TRANSACTION_TAGS]: relation.many.TransactionTagsEntityTable({
                from: relation.TransactionEntityTable.id,
                to: relation.TransactionTagsEntityTable.transactionId
            })
        }
    })
);
