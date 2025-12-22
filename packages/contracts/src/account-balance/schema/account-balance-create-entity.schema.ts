import { date } from 'zod';

import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

import { AccountBalanceEntitySchema } from './account-balance-entity.schema';

export const AccountBalanceCreateEntitySchema = convertToCreateEntitySchema(AccountBalanceEntitySchema)
    .extend({
        updatedAt: date()
    })
    .partial({
        updatedAt: true
    });
