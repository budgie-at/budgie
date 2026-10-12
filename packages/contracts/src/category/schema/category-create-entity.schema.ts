import * as Schema from 'effect/Schema';

import { OptionalNullablePositiveNumberSchema } from '../../@generic/schema/optional-nullable-positive-number.schema';
import { UserIconSchema } from '../../@generic/schema/user-icon.schema';
import { CATEGORY_TITLE_MAX_LENGTH } from '../constant/category-title-max-length.constant';
import { CATEGORY_TITLE_MIN_LENGTH } from '../constant/category-title-min-length.constant';

export const CategoryCreateEntitySchema = Schema.Struct({
    title: Schema.Trim.check(Schema.isMinLength(CATEGORY_TITLE_MIN_LENGTH), Schema.isMaxLength(CATEGORY_TITLE_MAX_LENGTH)),
    icon: UserIconSchema,
    parentId: OptionalNullablePositiveNumberSchema
});
