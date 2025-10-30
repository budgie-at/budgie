import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntitySchema = createSelectSchema(TagEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('The tag title.')
});
