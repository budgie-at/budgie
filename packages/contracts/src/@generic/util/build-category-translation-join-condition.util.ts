import { and, eq } from 'drizzle-orm';

import { DefaultCategoryTranslationEntityTable } from '../../category-translation/table/default-category-translation-entity.table';
import { CategoryEntityTable } from '../../category/table/category-entity.table';
import { LanguageEnum } from '../enum/language.enum';

export const buildCategoryTranslationJoinCondition = (language: LanguageEnum) =>
    and(
        eq(DefaultCategoryTranslationEntityTable.categoryId, CategoryEntityTable.id),
        eq(DefaultCategoryTranslationEntityTable.language, language)
    );
