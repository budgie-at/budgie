import { defineRelationsPart } from 'drizzle-orm';

import { AccountEntityTable } from '../../account/table/account-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { DebtEventEntityTable } from '../../debt-event/table/debt-event-entity.table';
import { MccCategoryEntityTable } from '../../mcc-category/table/mcc-category-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';
import { TransactionEntryEntityTable } from '../table/transaction-entry-entity.table';

export const TransactionEntryEntityRelations = defineRelationsPart(
    {
        AccountEntityTable,
        CategoryEntityTable,
        DebtEventEntityTable,
        MccCategoryEntityTable,
        TransactionEntityTable,
        TransactionEntryEntityTable
    },
    relation => ({
        TransactionEntryEntityTable: {
            [TransactionEntryAssociationEnum.TRANSACTION]: relation.one.TransactionEntityTable({
                from: relation.TransactionEntryEntityTable.transactionId,
                to: relation.TransactionEntityTable.id,
                optional: false
            }),
            [TransactionEntryAssociationEnum.DEBT_EVENTS]: relation.many.DebtEventEntityTable({
                from: relation.TransactionEntryEntityTable.id,
                to: relation.DebtEventEntityTable.transactionEntryId
            }),
            [TransactionEntryAssociationEnum.ACCOUNT]: relation.one.AccountEntityTable({
                from: relation.TransactionEntryEntityTable.accountId,
                to: relation.AccountEntityTable.id,
                optional: false
            }),
            [TransactionEntryAssociationEnum.CATEGORY]: relation.one.CategoryEntityTable({
                from: relation.TransactionEntryEntityTable.categoryId,
                to: relation.CategoryEntityTable.id
            }),
            [TransactionEntryAssociationEnum.MCC_CATEGORY]: relation.one.MccCategoryEntityTable({
                from: relation.TransactionEntryEntityTable.mccCategoryId,
                to: relation.MccCategoryEntityTable.id
            })
        }
    })
);
