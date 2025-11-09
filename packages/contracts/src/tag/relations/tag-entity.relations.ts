import { relations } from 'drizzle-orm';

import { TransactionToTagEntityTable } from '../../transaction-to-tag/table/transaction-to-tag-entity.table';
import { TagAssociationEnum } from '../enum/tag-association.enum';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntityRelations = relations(TagEntityTable, ({ many }) => ({
    [TagAssociationEnum.TRANSACTION_TO_TAGS]: many(TransactionToTagEntityTable)
}));
