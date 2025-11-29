import { relations } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { CategoryAssociationEnum } from '../enum/category-association.enum';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntityRelations = relations(CategoryEntityTable, ({ many, one }) => ({
    [CategoryAssociationEnum.TRANSACTION_ENTRIES]: many(TransactionEntryEntityTable),
    [CategoryAssociationEnum.CHILDREN]: many(CategoryEntityTable),
    [CategoryAssociationEnum.PARENT]: one(CategoryEntityTable, {
        fields: [CategoryEntityTable.parentId],
        references: [CategoryEntityTable.id]
    }),
    [CategoryAssociationEnum.ROOT]: one(CategoryEntityTable, {
        fields: [CategoryEntityTable.rootId],
        references: [CategoryEntityTable.id]
    })
}));
