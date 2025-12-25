import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { InstrumentEntitySchema } from './instrument-entity.schema';

export const InstrumentCreateEntitySchema = convertToCreateEntitySchema(InstrumentEntitySchema);
