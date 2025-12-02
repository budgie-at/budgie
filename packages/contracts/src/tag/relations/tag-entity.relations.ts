import { relations } from 'drizzle-orm';

import { TransactionTagsEntityTable } from '../../transaction-tags/table/transaction-tags-entity.table';
import { TagAssociationEnum } from '../enum/tag-association.enum';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntityRelations = relations(TagEntityTable, ({ many }) => ({
    [TagAssociationEnum.TRANSACTION_TAGS]: many(TransactionTagsEntityTable)
}));
