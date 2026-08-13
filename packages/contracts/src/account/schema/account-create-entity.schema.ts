import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = convertToCreateEntitySchema(AccountEntitySchema)
    .omit({
        titleSearch: true
    })
    .partial({
        iban: true,
        debtType: true,
        deadline: true,
        parentId: true,
        contactId: true,
        externalId: true,
        targetBalance: true,
        targetBaseInstrumentId: true,
        targetBaseExchangeRate: true,
        targetBaseAmount: true,
        interestRate: true,
        externalSource: true,
        integrationId: true,
        includeInNetWorth: true,
        isActive: true
    });
