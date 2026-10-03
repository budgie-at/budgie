import { defineRelationsPart } from 'drizzle-orm';

import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TagAssociationEnum } from '../enum/tag-association.enum';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntityRelations = defineRelationsPart(
    {
        TagEntityTable,
        TransactionTagsEntityTable
    },
    relation => ({
        TagEntityTable: {
            [TagAssociationEnum.TRANSACTION_TAGS]: relation.many.TransactionTagsEntityTable({
                from: relation.TagEntityTable.id,
                to: relation.TransactionTagsEntityTable.tagId
            })
        }
    })
);
