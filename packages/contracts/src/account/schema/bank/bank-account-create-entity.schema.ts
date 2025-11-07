import { BankAccountEntitySchema } from './bank-account-entity.schema';
import { convertToCreateEntitySchema } from '../../../generic/util/convert-to-create-entity-schema.util';

export const BankAccountCreateEntitySchema = convertToCreateEntitySchema(BankAccountEntitySchema).partial({
    order: true,
    includeInNetWorth: true
});
