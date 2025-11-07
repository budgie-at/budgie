import { array } from 'zod';

import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { StocksAccountEntitySchema } from './stocks-account-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const StocksAccountCreateEntitySchema = convertToCreateEntitySchema(StocksAccountEntitySchema)
    .extend({
        holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
    })
    .partial({
        order: true,
        includeInNetWorth: true
    });
