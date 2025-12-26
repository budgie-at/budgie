import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { CATEGORY_TITLE_MAX_LENGTH } from '../constant/category-title-max-length.constant';
import { CATEGORY_TITLE_MIN_LENGTH } from '../constant/category-title-min-length.constant';
import { CategoryEntityTable } from '../table/category-entity.table';

export const CategoryEntitySchema = createSelectSchema(CategoryEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(CATEGORY_TITLE_MIN_LENGTH).max(CATEGORY_TITLE_MAX_LENGTH).describe('The category title.'),
    icon: zodEnum(UserIconNameEnum).describe('The category icon.'),
    parentId: schema => schema.positive().nullable().describe('The id of the parent category.'),
    isSystemCategory: schema => schema.describe('Indicates if the category is a system category.'),
    isDefault: schema => schema.describe('Indicates if the category is a default system category.')
});
