import { createSelectSchema } from 'drizzle-zod';

import { INSTRUMENT_SYMBOL_MAX_LENGTH } from '../constant/instrument-symbol-max-length.constant';
import { INSTRUMENT_SYMBOL_MIN_LENGTH } from '../constant/instrument-symbol-min-length.constant';
import { InstrumentEntityTable } from '../table/instrument-entity.table';

export const InstrumentEntitySchema = createSelectSchema(InstrumentEntityTable, {
    accountId: schema => schema.describe('The id of the account the instrument belongs to.'),
    symbol: schema => schema.min(INSTRUMENT_SYMBOL_MIN_LENGTH).max(INSTRUMENT_SYMBOL_MAX_LENGTH).describe('The instrument symbol.')
});
