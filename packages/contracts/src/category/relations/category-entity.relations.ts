import { relations } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { CategoryAssociationEnum } from '../enum/category-association.enum';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntityRelations = relations(CategoryEntityTable, ({ many, one }) => ({
    [CategoryAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable),
    [CategoryAssociationEnum.CHILDREN]: many(CategoryEntityTable),
    [CategoryAssociationEnum.PARENT]: one(CategoryEntityTable, {
        fields: [CategoryEntityTable.parentId],
        references: [CategoryEntityTable.id]
    })
}));
