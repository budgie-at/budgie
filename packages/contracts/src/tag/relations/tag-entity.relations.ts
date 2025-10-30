import { relations } from 'drizzle-orm';

import { TransactionEntityTable } from '../../transaction/table/transaction-entity.table';
import { TagAssociationEnum } from '../enum/tag-association.enum';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntityRelations = relations(TagEntityTable, ({ many }) => ({
    [TagAssociationEnum.TRANSACTIONS]: many(TransactionEntityTable)
}));
