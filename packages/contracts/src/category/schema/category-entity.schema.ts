import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntitySchema = createSelectSchema(CategoryEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.describe('The category title.'),
    icon: schema => schema.describe('The category icon.')
});
