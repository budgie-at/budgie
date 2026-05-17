import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { DefaultCategoryTranslationEntitySchema } from './default-category-translation-entity.schema';

export const DefaultCategoryTranslationCreateEntitySchema = convertToCreateEntitySchema(DefaultCategoryTranslationEntitySchema);
