import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = convertToCreateEntitySchema(AccountEntitySchema).partial({
    iban: true,
    debtType: true,
    deadline: true,
    parentId: true,
    contactId: true,
    externalId: true,
    targetBalance: true,
    externalSource: true,
    includeInNetWorth: true,
    isActive: true
});
