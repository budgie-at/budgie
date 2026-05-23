import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { LanguageEnum } from '../../@generic/enum/language.enum';
import { DefaultCategoryTranslationEntityTable } from '../table/default-category-translation-entity.table';

export const DefaultCategoryTranslationEntitySchema = createSelectSchema(DefaultCategoryTranslationEntityTable, {
    ...BaseEntityFields,
    categoryId: schema => schema.positive().describe('The id of the default category being translated.'),
    language: zodEnum(LanguageEnum).describe('The language of the translation.'),
    title: schema => schema.describe('The translated category title for the given language.')
});
