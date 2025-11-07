import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

import { CashAccountEntitySchema } from './cash-account-entity.schema';

export const CashAccountCreateEntitySchema = convertToCreateEntitySchema(CashAccountEntitySchema).partial({
    order: true,
    includeInNetWorth: true
});
