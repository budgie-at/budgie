import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { BankAccountEntitySchema } from './bank-account-entity.schema';

export const BankAccountCreateEntitySchema = convertToCreateEntitySchema(BankAccountEntitySchema).partial({
    order: true,
    includeInNetWorth: true
});
