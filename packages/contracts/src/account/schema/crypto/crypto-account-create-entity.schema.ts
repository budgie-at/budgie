import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { CryptoAccountEntitySchema } from './crypto-account-entity.schema';

export const CryptoAccountCreateEntitySchema = CryptoAccountEntitySchema.pick({ type: true }).extend({
    holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
});
