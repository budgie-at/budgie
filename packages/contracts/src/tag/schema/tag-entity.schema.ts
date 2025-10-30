import { createSelectSchema } from 'drizzle-zod';

import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntitySchema = createSelectSchema(TagEntityTable);
