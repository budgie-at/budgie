import { createSelectSchema } from 'drizzle-zod';

import { HoldingEntityTable } from '../table/holding-entity.table';

export const HoldingEntitySchema = createSelectSchema(HoldingEntityTable, {
    instrumentId: schema => schema.positive().describe('The id of the instrument the holding belongs to.'),
    quantity: schema => schema.nonnegative().describe('The holding quantity.')
});
