import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { MCC_CODE_LENGTH } from '../constant/mcc-code-length.constant';
import { MCC_DESCRIPTION_MAX_LENGTH } from '../constant/mcc-description-max-length.constant';
import { MccCategoryEntityTable } from '../table/mcc-category-entity.table';

export const MccCategoryEntitySchema = createSelectSchema(MccCategoryEntityTable, {
    ...BaseEntityFields,
    mcc: schema => schema.length(MCC_CODE_LENGTH).describe('The MCC code (4 digits).'),
    mccGroupId: schema => schema.positive().describe('The id of the MCC group.'),
    shortDescription: schema => schema.min(1).max(MCC_DESCRIPTION_MAX_LENGTH).describe('The short description of the MCC.'),
    fullDescription: schema => schema.min(1).max(MCC_DESCRIPTION_MAX_LENGTH).describe('The full description of the MCC.')
});
