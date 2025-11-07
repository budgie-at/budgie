import { array } from 'zod';

import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';
import { HoldingCreateEntitySchema } from '../../../holding/schema/holding-create-entity.schema';

import { StocksAccountEntitySchema } from './stocks-account-entity.schema';

export const StocksAccountCreateEntitySchema = convertToCreateEntitySchema(StocksAccountEntitySchema)
    .extend({
        holdings: array(HoldingCreateEntitySchema).describe('Holdings of the account.')
    })
    .partial({
        order: true,
        includeInNetWorth: true
    });
