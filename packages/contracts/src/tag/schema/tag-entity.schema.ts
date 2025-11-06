import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { TAG_TITLE_MAX_LENGTH } from '../constant/tag-title-max-length.constant';
import { TAG_TITLE_MIN_LENGTH } from '../constant/tag-title-min-length.constant';
import { TagEntityTable } from '../table/tag-entity.table';

export const TagEntitySchema = createSelectSchema(TagEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(TAG_TITLE_MIN_LENGTH).max(TAG_TITLE_MAX_LENGTH).describe('The tag title.')
});
