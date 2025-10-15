import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { StocksAccountEntitySchema } from './stocks-account-entity.schema';

export const StocksAccountCreateEntitySchema = StocksAccountEntitySchema.pick({ type: true }).extend({
    holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
});
