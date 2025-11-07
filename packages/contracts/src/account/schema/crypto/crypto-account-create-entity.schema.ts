import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { CryptoAccountEntitySchema } from './crypto-account-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const CryptoAccountCreateEntitySchema = convertToCreateEntitySchema(CryptoAccountEntitySchema)
    .extend({
        holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
    })
    .partial({
        order: true,
        includeInNetWorth: true
    });
