import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { MCC_GROUP_DESCRIPTION_MAX_LENGTH } from '../constant/mcc-group-description-max-length.constant';
import { MCC_GROUP_TYPE_MAX_LENGTH } from '../constant/mcc-group-type-max-length.constant';
import { MccGroupEntityTable } from '../table/mcc-group-entity.table';

export const MccGroupEntitySchema = createSelectSchema(MccGroupEntityTable, {
    ...BaseEntityFields,
    type: schema => schema.min(1).max(MCC_GROUP_TYPE_MAX_LENGTH).describe('The MCC group type code.'),
    description: schema => schema.min(1).max(MCC_GROUP_DESCRIPTION_MAX_LENGTH).describe('The MCC group description.')
});
