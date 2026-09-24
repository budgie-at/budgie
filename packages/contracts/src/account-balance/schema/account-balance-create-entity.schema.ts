import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { AccountBalanceEntitySchema } from './account-balance-entity.schema';

export const AccountBalanceCreateEntitySchema = convertToCreateEntitySchema(AccountBalanceEntitySchema);
