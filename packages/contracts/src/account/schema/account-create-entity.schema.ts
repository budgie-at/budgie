import { number } from 'zod';

import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = AccountEntitySchema.pick({
    icon: true,
    type: true,
    order: true,
    title: true,
    nature: true,
    parentId: true,
    externalId: true,
    instrumentId: true,
    externalSource: true,
    includeInNetWorth: true
})
    .partial({
        order: true,
        parentId: true,
        externalId: true,
        externalSource: true,
        includeInNetWorth: true
    })
    .extend({
        currentBalance: number().default(0).describe('The initial balance of the account.')
    })
    .required({ currentBalance: true });
