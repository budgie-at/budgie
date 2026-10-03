import { defineRelationsPart } from 'drizzle-orm';

import { TagEntityTable } from '../../tag/table/tag-entity.table';
import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TransactionTagsAssociationEnum } from '../enum/transaction-tags-association.enum';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export const TransactionTagsEntityRelations = defineRelationsPart(
    {
        TagEntityTable,
        TransactionEntityTable,
        TransactionTagsEntityTable
    },
    relation => ({
        TransactionTagsEntityTable: {
            [TransactionTagsAssociationEnum.TRANSACTION]: relation.one.TransactionEntityTable({
                from: relation.TransactionTagsEntityTable.transactionId,
                to: relation.TransactionEntityTable.id,
                optional: false
            }),
            [TransactionTagsAssociationEnum.TAG]: relation.one.TagEntityTable({
                from: relation.TransactionTagsEntityTable.tagId,
                to: relation.TagEntityTable.id,
                optional: false
            })
        }
    })
);
