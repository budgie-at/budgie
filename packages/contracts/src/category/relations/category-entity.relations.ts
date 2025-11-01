import { relations } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { CategoryAssociationEnum } from '../enum/category-association.enum';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntityRelations = relations(CategoryEntityTable, ({ many }) => ({
    [CategoryAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable)
}));
