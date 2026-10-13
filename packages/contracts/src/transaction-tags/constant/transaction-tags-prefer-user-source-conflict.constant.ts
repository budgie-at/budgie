import { sql } from 'drizzle-orm';

import { TagSourceEnum } from '../enum/tag-source.enum';
import { TransactionTagsEntityTable } from '../table/transaction-tags-entity.table';

export const TRANSACTION_TAGS_PREFER_USER_SOURCE_CONFLICT = {
    target: [TransactionTagsEntityTable.transactionId, TransactionTagsEntityTable.tagId],
    set: { source: TagSourceEnum.USER },
    setWhere: sql`excluded.source = ${TagSourceEnum.USER} AND ${TransactionTagsEntityTable.source} <> ${TagSourceEnum.USER}`
};
