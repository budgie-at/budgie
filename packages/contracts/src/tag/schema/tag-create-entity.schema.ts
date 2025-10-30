import { createInsertSchema } from 'drizzle-zod';

import { TagEntityTable } from '../table/tag-entity.table';

export const TagCreateEntitySchema = createInsertSchema(TagEntityTable);
