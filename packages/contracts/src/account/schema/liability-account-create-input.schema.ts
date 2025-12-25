import { convertToCreateEntitySchema } from '../../generic/util/convert-to-create-entity-schema.util';

import { AccountEntitySchema } from './account-entity.schema';

export const LiabilityAccountCreateInputSchema = convertToCreateEntitySchema(AccountEntitySchema).omit({
    externalSource: true,
    externalId: true,
    contactId: true,
    deadline: true,
    debtType: true,
    nature: true
});
