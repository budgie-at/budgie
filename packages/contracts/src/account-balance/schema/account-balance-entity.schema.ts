import { createSelectSchema } from 'drizzle-zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { AccountBalanceEntityTable } from '../table/account-balance-entity.table';

export const AccountBalanceEntitySchema = createSelectSchema(AccountBalanceEntityTable, {
    ...BaseEntityFields,
    amount: schema => schema.describe('The account balance.'),
    accountId: schema => schema.positive().describe('The id of the account.'),
    instrumentId: schema => schema.positive().describe('The id of the instrument.'),
    parentAccountId: schema => schema.positive().describe('The id of the parent account.')
});
