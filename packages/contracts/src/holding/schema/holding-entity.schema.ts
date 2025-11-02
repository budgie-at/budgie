import { createSelectSchema } from 'drizzle-zod';

import { HoldingEntityTable } from '../table/holding-entity.table';

export const HoldingEntitySchema = createSelectSchema(HoldingEntityTable, {
    instrument: schema => schema.describe('The instrument the holding belongs to.'),
    quantity: schema => schema.nonnegative().describe('The holding quantity.')
});
