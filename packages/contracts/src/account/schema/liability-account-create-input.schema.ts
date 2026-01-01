import { number } from 'zod';

import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const LiabilityAccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema)
    .extend({
        currentBalance: number().describe('The current/initial balance of the account.')
    })
    .omit({
        targetBalance: true,
        contactId: true,
        deadline: true,
        debtType: true,
        nature: true,
        order: true
    })
    .partial({
        includeInNetWorth: true,
        externalSource: true,
        externalId: true,
        parentId: true,
        iban: true,
        isActive: true
    });
