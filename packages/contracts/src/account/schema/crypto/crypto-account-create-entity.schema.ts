import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { CryptoAccountEntitySchema } from './crypto-account-entity.schema';

export const CryptoAccountCreateEntitySchema = CryptoAccountEntitySchema.omit({
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
