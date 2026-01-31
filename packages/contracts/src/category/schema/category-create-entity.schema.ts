import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { CategoryEntitySchema } from './category-entity.schema';

export const CategoryCreateEntitySchema = convertToCreateEntitySchema(CategoryEntitySchema)
    .omit({
        isDefault: true,
        isSystemCategory: true,
        titleSearch: true,
        titleEn: true,
        titleTags: true,
        tagsGeneratedAt: true
    })
    .partial({
        parentId: true
    });
