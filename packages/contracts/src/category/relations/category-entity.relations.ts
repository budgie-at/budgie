import { defineRelationsPart } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { CategoryAssociationEnum } from '../enum/category-association.enum';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntityRelations = defineRelationsPart(
    {
        CategoryEntityTable,
        TransactionEntryEntityTable
    },
    relation => ({
        CategoryEntityTable: {
            [CategoryAssociationEnum.TRANSACTION_ENTRIES]: relation.many.TransactionEntryEntityTable({
                from: relation.CategoryEntityTable.id,
                to: relation.TransactionEntryEntityTable.categoryId
            }),
            [CategoryAssociationEnum.CHILDREN]: relation.many.CategoryEntityTable({
                from: relation.CategoryEntityTable.id,
                to: relation.CategoryEntityTable.parentId
            }),
            [CategoryAssociationEnum.PARENT]: relation.one.CategoryEntityTable({
                from: relation.CategoryEntityTable.parentId,
                to: relation.CategoryEntityTable.id
            })
        }
    })
);
