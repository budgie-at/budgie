import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountTypeEnumSchema } from './account-type-enum.schema';

export const AccountEntitySchema = BaseEntitySchema.extend({
    type: AccountTypeEnumSchema.describe('Type of the account.'),

    get [AccountAssociationEnum.TRANSACTIONS]() {
        return TransactionEntitySchema.describe('Transactions associated with the account.');
    }
});
