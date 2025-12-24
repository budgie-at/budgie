import { number } from 'zod';

import { AccountEntitySchema } from './account-entity.schema';
import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

export const AccountCreateEntitySchema = convertToCreateEntitySchema(AccountEntitySchema)
    .partial({
        iban: true,
        order: true,
        debtType: true,
        parentId: true,
        returnAt: true,
        externalId: true,
        amountToReturn: true,
        externalSource: true,
        iban: true,
        includeInNetWorth: true
    })
    .extend({
        currentBalance: number().default(0).describe('The initial balance of the account.')
    })
    .required({ currentBalance: true });
