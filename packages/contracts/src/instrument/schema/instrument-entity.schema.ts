import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { InstrumentTypeEnum } from '../enum/instrument-type.enum';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntitySchema = createSelectSchema(InstrumentEntityTable, {
    ...BaseEntityFields,
    name: schema => schema.describe('The instrument name.'),
    type: zodEnum(InstrumentTypeEnum).describe('The instrument type.'),
    symbol: schema => schema.describe('The instrument symbol.'),
    code: schema => schema.describe('The instrument code.')
});
