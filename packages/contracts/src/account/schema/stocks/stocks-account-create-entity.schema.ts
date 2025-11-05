import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { StocksAccountEntitySchema } from './stocks-account-entity.schema';

export const StocksAccountCreateEntitySchema = StocksAccountEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
})
    .extend({
        holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
    })
    .partial({
        order: true,
        includeInNetWorth: true
    });
