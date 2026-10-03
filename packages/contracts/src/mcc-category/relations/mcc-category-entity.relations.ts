import { defineRelationsPart } from 'drizzle-orm';

import { MccGroupEntityTable } from '../../mcc-group/table/mcc-group-entity.table';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { MccCategoryAssociationEnum } from '../enum/mcc-category-association.enum';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

export const MccCategoryEntityRelations = defineRelationsPart(
    {
        MccCategoryEntityTable,
        MccGroupEntityTable,
        TransactionEntryEntityTable
    },
    relation => ({
        MccCategoryEntityTable: {
            [MccCategoryAssociationEnum.MCC_GROUP]: relation.one.MccGroupEntityTable({
                from: relation.MccCategoryEntityTable.mccGroupId,
                to: relation.MccGroupEntityTable.id,
                optional: false
            }),
            [MccCategoryAssociationEnum.TRANSACTION_ENTRIES]: relation.many.TransactionEntryEntityTable({
                from: relation.MccCategoryEntityTable.id,
                to: relation.TransactionEntryEntityTable.mccCategoryId
            })
        }
    })
);
