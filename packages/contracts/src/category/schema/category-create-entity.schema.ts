import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

import { CategoryEntitySchema } from './category-entity.schema';

export const CategoryCreateEntitySchema = convertToCreateEntitySchema(CategoryEntitySchema)
    .omit({
        isDefault: true,
        isSystemCategory: true
    })
    .partial({
        parentId: true
    });
