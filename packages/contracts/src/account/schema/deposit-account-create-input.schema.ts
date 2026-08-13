import { boolean, number } from 'zod';

import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const DepositAccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema)
    .omit({
        order: true,
        nature: true,
        parentId: true,
        debtType: true,
        externalId: true,
        contactId: true,
        targetBalance: true,
        targetBaseInstrumentId: true,
        targetBaseExchangeRate: true,
        targetBaseAmount: true,
        externalSource: true,
        titleSearch: true
    })
    .partial({
        deadline: true,
        integrationId: true,
        interestRate: true
    })
    .extend({
        currentBalance: number().nonnegative(),
        includeInNetWorth: boolean().optional(),
        isActive: boolean().optional()
    });
