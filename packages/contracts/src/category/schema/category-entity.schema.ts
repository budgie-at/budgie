import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { CATEGORY_TITLE_MAX_LENGTH } from '../constant/category-title-max-length.constant';
import { CATEGORY_TITLE_MIN_LENGTH } from '../constant/category-title-min-length.constant';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntitySchema = createSelectSchema(CategoryEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(CATEGORY_TITLE_MIN_LENGTH).max(CATEGORY_TITLE_MAX_LENGTH).describe('The category title.'),
    icon: schema => schema.describe('The category icon.'),
    parentId: schema => schema.positive().nullable().describe('The id of the parent category.'),
});
