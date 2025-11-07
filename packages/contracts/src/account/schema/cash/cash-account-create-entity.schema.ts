import { CashAccountEntitySchema } from './cash-account-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const CashAccountCreateEntitySchema = convertToCreateEntitySchema(CashAccountEntitySchema).partial({
    order: true,
    includeInNetWorth: true
});
