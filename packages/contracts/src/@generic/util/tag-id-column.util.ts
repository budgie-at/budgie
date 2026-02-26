import { int } from 'drizzle-orm/sqlite-core';

import { TagEntityTable } from '../../tag/table/tag-entity.table';

export const tagIdColumn = () =>
    int('tag_id', { mode: 'number' })
        .references(() => TagEntityTable.id, { onDelete: 'cascade' })
        .notNull();
